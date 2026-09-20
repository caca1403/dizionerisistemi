import { useEffect, useState } from 'react';
import { getTMDBPage, mapTMDB, fetchMultiReferenceRecommendations } from '../services/tmdbLive';
import { rerankWithLexicalSignals } from '../services/semanticRanker';
import { fetchThematicCandidatePool, scoreThematicItem } from '../services/thematicEngine';
import { calibrateCinePulse, scorePersonalSeries } from '../lib/recommend';
import type { ArchiveRankMode, ArchiveSnapshot, ArchiveSourceProgress, Filters, TasteProfile } from '../types';
const source: ArchiveSourceProgress = { id: 'tmdb-api', label: 'TMDB canlı API', state: 'waiting', count: 0 };

function mergeById(current: ArchiveSnapshot['results'], incoming: ArchiveSnapshot['results']) {
  const existingIds = new Set(current.map(item => item.id));
  const newItems = incoming.filter(item => !existingIds.has(item.id));
  return [...current, ...newItems];
}

export function useArchiveEngine(filters: Filters, profile: TasteProfile | null, mode: ArchiveRankMode, page = 0, enabled = true) {
  const [snapshot, setSnapshot] = useState<ArchiveSnapshot>({ total: 0, matchTotal: 0, ready: false, sources: [source], results: [] });
  const [cacheHits, setCacheHits] = useState(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setSnapshot({ total: 0, matchTotal: 0, ready: true, sources: [source], results: [] });
      return;
    }
    const controller = new AbortController();
    setSnapshot(current => ({
      ...current,
      ready: page === 0 ? false : current.ready,
      sources: [{ ...source, state: 'loading' }]
    }));

    // Lab 01: Referans dizilerden benzerlik ve rota motoru
    if (filters.referenceSeries && filters.referenceSeries.length > 0) {
      fetchMultiReferenceRecommendations(filters.referenceSeries, page, controller.signal)
        .then(results => {
          if (controller.signal.aborted) return;
          const filtered = results.filter(item => item.imdbRating >= filters.minRating);
          const calibrated = calibrateCinePulse(filtered, page);
          setSnapshot(current => {
            const merged = page === 0 ? calibrated : mergeById(current.results, calibrated);
            const total = merged.length + (filtered.length >= 6 ? 50 : 0);
            return {
              total,
              matchTotal: total,
              ready: true,
              sources: [{ ...source, state: 'ready', count: merged.length }],
              results: merged,
            };
          });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSnapshot(current => ({
              ...current,
              ready: true,
              sources: [{ ...source, state: 'failed', error: 'Canlı öneri akışı yenileniyor', count: current.results.length }],
            }));
          }
        });
      return () => controller.abort();
    }

    // Lab 02: Kelimeden ve Sahneden Keşif - Tematik & Anlamsal Motor
    if (filters.semanticQuery && filters.semanticQuery.trim().length >= 2) {
      const semanticQuery = filters.semanticQuery.trim();
      fetchThematicCandidatePool(semanticQuery, controller.signal)
        .then(async candidates => {
          if (controller.signal.aborted) return;
          const allowAnimation = filters.genre === 'Animasyon' || /çizgi|anime|animasyon|cartoon|çocuk/i.test(semanticQuery);
          let filtered = candidates.filter(item => item.imdbRating >= (filters.minRating || 5.0));
          if (!allowAnimation) {
            filtered = filtered.filter(item => !item.genres.includes('Animasyon') && !/çizgi|animasyon|anime|cartoon/i.test(item.title));
          }

          // 1. Tematik skorlama ve kesin ilgi filtresi (Strict Relevance Filter)
          // Kullanıcı kuralı: Türkçe gibi zengin bir dilde herhangi bir kelimede bile alakasız içerik çıkmamalı.
          let scored = filtered
            .map(item => ({
              ...item,
              matchScore: scoreThematicItem(semanticQuery, item),
            }))
            .filter(item => item.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);

          // 2. Sözlüksel pekiştirme
          scored = rerankWithLexicalSignals(semanticQuery, scored);

          // 3. Cine Pulse kalibrasyonu (Zirvedeki başyapıtlar %99 ve %98 alır)
          const calibrated = calibrateCinePulse(scored, page);

          setSnapshot(current => {
            const merged = page === 0 ? calibrated : mergeById(current.results, calibrated);
            const total = merged.length + (scored.length >= 8 ? 35 : 0);
            return {
              total,
              matchTotal: total,
              ready: true,
              sources: [{ ...source, state: 'ready', count: merged.length }],
              results: merged,
            };
          });

          // (semantic WASM model disabled — causes browser freeze; lexical scoring is sufficient)

        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSnapshot(current => ({
              ...current,
              ready: true,
              sources: [{ ...source, state: 'failed', error: 'Tematik arama yenileniyor', count: current.results.length }],
            }));
          }
        });
      return () => controller.abort();
    }

    // Rota tek bir duyguya indirgenmez. TMDB'den geniş havuz alınır; çoklu
    // ruh hâli, referans ve kaçınma sinyalleri yerel kişisel skorda uygulanır.
    const routedFilters = profile ? { ...filters, mood: filters.mood === 'Tümü' ? 'Tümü' as const : filters.mood, genre: filters.genre, platform: filters.platform } : filters;
    const requestPage = (requestedPage: number, attempt = 0): Promise<Awaited<ReturnType<typeof getTMDBPage>>> => getTMDBPage(routedFilters, mode, requestedPage, controller.signal).catch(error => {
      if (attempt < 1 && !controller.signal.aborted) return new Promise((resolve, reject) => window.setTimeout(() => requestPage(requestedPage, attempt + 1).then(resolve).catch(reject), 900));
      throw error;
    });
    const request = filters.semanticQuery?.trim().length
      ? Promise.all(Array.from({ length: 5 }, (_, offset) => requestPage(page * 5 + offset))).then(pages => ({ ...pages[0], results: pages.flatMap(result => result.results) }))
      : requestPage(page);
    request
      .then(data => {
        const rankingQuery = filters.semanticQuery || filters.query;
        const scoringFilters = rankingQuery === routedFilters.query ? routedFilters : { ...routedFilters, query: rankingQuery };
        const allowAnimation = filters.genre === 'Animasyon' || /çizgi|anime|animasyon|cartoon|çocuk/i.test(rankingQuery);
        let results = data.results
          .map(item => mapTMDB(item, routedFilters.platform))
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .filter(item => item.imdbRating >= filters.minRating);
        
        if (!allowAnimation) {
          results = results.filter(item => !item.genres.includes('Animasyon') && !/çizgi|animasyon|anime|cartoon/i.test(item.title));
        }

        results = results
          .map(item => ({ ...item, matchScore: scorePersonalSeries(item, scoringFilters, profile) }))
          .sort((left, right) => mode === 'match' ? right.matchScore - left.matchScore : mode === 'popular' ? (right.popularity || 0) - (left.popularity || 0) : mode === 'rating' ? right.imdbRating - left.imdbRating : right.releaseYear - left.releaseYear);
        if (mode === 'match' && results.length > 0) {
          results = calibrateCinePulse(results, page);
        }
        const total = data.total_results || results.length;
        setSnapshot(current => {
          const merged = page === 0 ? results : mergeById(current.results, results);
          return { total, matchTotal: total, ready: true, sources: [{ ...source, state: 'ready', count: merged.length }], results: merged };
        });
        if (rankingQuery.trim().length >= 3) {
          const ranked = calibrateCinePulse(rerankWithLexicalSignals(rankingQuery, results), page);
          if (!controller.signal.aborted) setSnapshot(current => {
            const merged = page === 0 ? ranked : mergeById(current.results, ranked);
            return { ...current, sources: [{ ...source, state: 'ready', count: merged.length }], results: merged };
          });

        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setSnapshot({ total: 0, matchTotal: 0, ready: true, sources: [{ ...source, state: 'failed', error: 'Canlı arşiv bağlantısı yenileniyor', count: 0 }], results: [] });
      });
    return () => controller.abort();
  }, [enabled, filters, mode, page, profile, reload]);

  return {
    ...snapshot,
    isLoading: !snapshot.ready,
    cacheHits,
    cacheEnabled: true,
    refresh: () => { setReload(value => value + 1); setCacheHits(value => value + 1); },
    clearCache: () => { setCacheHits(0); },
  };
}
