import type { ArchiveRankMode, Filters, TVSeries } from '../../types';
import { FilterMatrix } from './FilterMatrix';
import { DiscoveryTools } from './DiscoveryTools';
import { TrendAtlas } from './TrendAtlas';
import { SeriesGrid } from './SeriesGrid';

type Props = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  routeItems: TVSeries[];
  routeLoading: boolean;
  routeTotal: number;
  routePage: number;
  onRoutePage: (page: number) => void;
  wordItems: TVSeries[];
  wordLoading: boolean;
  wordTotal: number;
  wordPage: number;
  onWordPage: (page: number) => void;
  filterItems: TVSeries[];
  filterLoading: boolean;
  filterTotal: number;
  filterPage: number;
  onFilterPage: (page: number) => void;
  onQuery: (query: string, referenceSignals?: string[], stream?: 'route' | 'word', referenceSeries?: TVSeries[]) => void;
  onToast: (message: string) => void;
  rankMode: ArchiveRankMode;
  onRankMode: (mode: ArchiveRankMode) => void;
  onOpen: (series: TVSeries) => void;
  onToggle: (series: TVSeries) => void;
  savedIds: Set<string>;
};

export function RecommendationEngine(props: Props) {
  return (
    <section id="recommendation-engine" className="recommendation-engine">
      {/* Popüler ve Trend Yapımlar Özeti */}
      <TrendAtlas
        items={props.filterItems.length ? props.filterItems : props.routeItems}
        mode={props.rankMode}
        onMode={props.onRankMode}
        onOpen={props.onOpen}
      />

      {/* 3 Ayrı Keşif Motoru (Sonuçları doğrudan araçların altında genişleyen pencerelerde gösterilir) */}
      <DiscoveryTools
        items={[...props.routeItems, ...props.filterItems]}
        onQuery={props.onQuery}
        onToast={props.onToast}
        onOpen={props.onOpen}
        onToggle={props.onToggle}
        savedIds={props.savedIds}
        routeItems={props.routeItems}
        routeLoading={props.routeLoading}
        routeTotal={props.routeTotal}
        routePage={props.routePage}
        onRoutePage={props.onRoutePage}
        wordItems={props.wordItems}
        wordLoading={props.wordLoading}
        wordTotal={props.wordTotal}
        wordPage={props.wordPage}
        onWordPage={props.onWordPage}
      />

      {/* Bağımsız Canlı TMDB Arşivi ve Filtre Matrisi */}
      <div id="filter-results" className="general-archive-section">
        <FilterMatrix
          filters={props.filters}
          setFilters={(next) => {
            props.onFilterPage(0);
            props.setFilters(next);
          }}
        />

        <SeriesGrid
          items={props.filterItems}
          loading={props.filterLoading && !props.filterItems.length}
          total={props.filterTotal}
          page={props.filterPage}
          onPage={props.onFilterPage}
          onOpen={props.onOpen}
          onToggle={props.onToggle}
          savedIds={props.savedIds}
        />
      </div>
    </section>
  );
}

