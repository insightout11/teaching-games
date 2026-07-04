import type { Difficulty } from '@/lib/difficulty';
import type { SourceCitation, SourceMaterial } from '@/types/source-material';

export type DestinationSceneTerrain = 'coastal' | 'mountain' | 'flatland' | 'desert' | 'island' | 'urban';
export type DestinationSceneVegetation = 'palms' | 'pines' | 'broadleaf' | 'sakura' | 'none';
export type DestinationSceneSkyline = 'low' | 'dense' | 'highrise' | 'historic';

export interface DestinationImage {
  url: string;
  alt: string;
  caption: string;
  sourceName: string;
  sourceUrl: string;
  creator?: string;
  license?: string;
  focalPoint?: { x: number; y: number };
}

export interface DestinationScene {
  terrain: DestinationSceneTerrain;
  vegetation?: DestinationSceneVegetation;
  skyline: DestinationSceneSkyline;
  /**
   * Optional bespoke city skyline. When set, the skyline layer renders a
   * city-specific massing/rooflines/accents instead of the generic `skyline`
   * family. Additive — omit it and the generic family is used unchanged.
   */
  skylineVariant?:
    | 'tokyo'
    | 'paris'
    | 'rio'
    | 'nyc'
    | 'london'
    | 'dubai'
    | 'singapore'
    | 'sydney'
    | 'hongkong'
    | 'moscow'
    | 'istanbul'
    | 'berlin'
    | 'seoul'
    | 'bangkok'
    | 'beijing'
    | 'shanghai'
    | 'rome'
    | 'amsterdam'
    | 'capetown'
    | 'toronto'
    | 'cairo'
    | 'la'
    | 'mumbai'
    | 'madrid'
    | 'mexicocity'
    | 'buenosaires'
    | 'vancouver'
    | 'miami'
    | 'honolulu'
    | 'delhi'
    | 'jakarta'
    | 'lagos'
    | 'lisbon'
    | 'dublin'
    | 'reykjavik'
    | 'panamacity'
    | 'hcmc'
    | 'almaty'
    | 'nairobi'
    | 'lima'
    | 'bogota'
    | 'perth'
    | 'auckland'
    | 'suva'
    | 'ulaanbaatar'
    | 'dakar'
    | 'manila'
    | 'santiago'
    | 'recife'
    | 'addisababa'
    | 'homebase';
  landmarkSilhouette?: string;
  palette: 'dawn' | 'night' | 'golden' | 'tropical' | 'winter';
}

export type DestinationFocusKind = 'video' | 'reading';
export type DestinationFocusReviewStatus = 'draft' | 'researched' | 'transcript-verified';

export type DestinationCitation = SourceCitation;

export interface DestinationFocusReview {
  status: DestinationFocusReviewStatus;
  reviewedAt?: string;
  transcriptLanguage?: string;
}

export interface DestinationEvidence {
  investigationTags: string[];
  keyIdea: string;
  tradeoff: string;
  designUse: string;
}

export interface DestinationFocus {
  id: string;
  kind: DestinationFocusKind;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  lessonGoal: string;
  skills: string[];
  image: DestinationImage;
  publisher: string;
  sourceUrl?: string;
  citations?: DestinationCitation[];
  review: DestinationFocusReview;
  evidence?: DestinationEvidence;
  sourceMaterial: SourceMaterial;
}

export type TravelAnchorReviewStatus = 'draft' | 'researched' | 'verified';

export interface TravelAnchorReview {
  status: TravelAnchorReviewStatus;
  reviewedAt?: string;
}

/** A real signature dish of the city. Feeds the Local Table menu board + ordering roleplay. */
export interface TravelDish {
  id: string;
  name: string;
  whatItIs: string;
  note?: string;
  sourceUrl?: string;
  image?: DestinationImage;
  review: TravelAnchorReview;
}

/** A real, visitable place. Feeds the Attraction Class Board. */
export interface TravelAttraction {
  id: string;
  name: string;
  whatItIs: string;
  whyVisit?: string;
  sourceUrl?: string;
  image?: DestinationImage;
  review: TravelAnchorReview;
}

/** How to get from the real airport into the city. Grounds the getting-there roleplay. */
export interface TravelTransportOption {
  mode: string;
  fromAirport: string;
  approxTimeMin?: number;
  approxCost?: string;
  note?: string;
}

/** An authentic traveler-should-know note. Feeds the weighted travel moment deck. */
export interface TravelLocalColorNote {
  id: string;
  text: string;
  category?: 'custom' | 'etiquette' | 'money' | 'safety' | 'seasonal' | 'transport';
}

export interface TravelAnchors {
  dishes: TravelDish[];
  attractions: TravelAttraction[];
  transport?: TravelTransportOption[];
  localColor?: TravelLocalColorNote[];
}

export interface DestinationPack {
  id: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  primaryAirport: string;
  airports: string[];
  scene: DestinationScene;
  heroImage: DestinationImage;
  focusOptions: DestinationFocus[];
  travelAnchors?: TravelAnchors;
}
