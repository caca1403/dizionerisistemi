export type StreamingPlatform = 'Netflix' | 'HBO Max' | 'Disney+' | 'Prime Video' | 'Apple TV+' | 'BluTV';
export type MoodTag = 'Zihin Yakan' | 'Distopya' | 'Karanlık/Gerilim' | 'Siberpunk/Teknoloji' | 'Politik/Güç' | 'Melankolik' | 'Yüksek Adrenalin' | 'Konfor/Rahatlatıcı';

export interface EmotionProfile { mystery:number; psychological:number; pacing:number; humor:number; complexity:number; }
export interface CastMember { id:string; name:string; character:string; avatarUrl?:string; }
export interface PosterCNNAnalysis { dominantColors:string[]; visualMood:string; lightingContrast:'Low'|'Medium'|'High'; }
export interface TVSeries {
  id:string; title:string; originalTitle:string; posterUrl:string; backdropUrl:string;
  releaseYear:number; endYear?:number|null; status:'Continuing'|'Ended'; seasonsCount:number; totalEpisodes:number;
  imdbRating:number; matchScore:number; platforms:StreamingPlatform[]; genres:string[]; moodTags:MoodTag[];
  emotionProfile:EmotionProfile; synopsis:string; aiRecommendationReason:string; similarSeriesIds:string[];
  cast:CastMember[]; deepLinkUrl:string; trailerUrl:string; posterCNN:PosterCNNAnalysis;
  /** Kaydın geldiği arşiv; mevcut sorgu ve veri aktarım ekranında gösterilir. */
  dataSource?: string;
  popularity?: number;
  voteCount?: number;
  similarityBreakdown?: SimilarityBreakdown;
}
export interface SimilarityBreakdown {
  semantic: number;
  synopsis: number;
  referenceGenres: number;
  content: number;
  mood: number;
  visual: number;
  total: number;
}
export type WatchState = 'plan' | 'watching' | 'completed';
export interface WatchlistItem { seriesId:string; state:WatchState; episode:number; }
export interface CustomList { id:string; name:string; items: TVSeries[]; createdAt:number; }
export interface TasteProfile { mood:MoodTag; moods?:MoodTag[]; pacing:number; complexity:number; platform:StreamingPlatform|'Tümü'; referenceTitles?:string[]; referenceSignals?:string[]; keywords?:string[]; avoidTags?:MoodTag[]; session?:'Kısa akşam'|'Hafta sonu'|'Uzun maraton'; }
export interface Filters { mood:MoodTag | 'Tümü'; genre:string; platform:StreamingPlatform | 'Tümü'; minRating:number; status:'Tümü'|'Ended'|'Continuing'; pacing:[number,number]; complexity:[number,number]; query:string; semanticQuery?: string; referenceSignals?: string[]; referenceSeriesIds?: string[]; referenceSeries?: TVSeries[]; }

export type ArchiveSourceId = 'tmdb-api';
export type ArchiveSourceState = 'waiting' | 'loading' | 'ready' | 'failed';
export interface ArchiveSourceProgress {
  id: ArchiveSourceId;
  label: string;
  state: ArchiveSourceState;
  count: number;
  error?: string;
}

export interface ArchiveSnapshot {
  total: number;
  matchTotal: number;
  ready: boolean;
  sources: ArchiveSourceProgress[];
  results: TVSeries[];
}
export type ArchiveRankMode = 'match' | 'popular' | 'rating' | 'newest';
