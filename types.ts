
export enum Platform {
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  CLASSIC = '4:3'
}

export enum ProductCategory {
  PACKAGING = 'Packaging (B2B)',
  EQUIPMENT = 'Equipment (B2C)'
}

export enum PostObjective {
  TASTE_QUALITY = 'Taste & Quality Focus',
  NEW_ARRIVAL = 'New Arrival',
  ROASTERY_SKILL = 'Roastery & Expertise',
  PROMOTION = 'Promotion/Special Offer'
}

export enum BagColor {
  C001 = '001 Kraft Paper',
  C002 = '002 Clear/Frosty',
  C003 = '003 Gold Metallic',
  C004 = '004 Silver Metallic',
  C005 = '005 Black Glossy',
  C006 = '006 White Glossy',
  C007 = '007 Black Matte',
  C008 = '008 Brown Matte',
  C009 = '009 Teal Matte',
  C010 = '010 Green Matte',
  C011 = '011 Navy Matte',
  C012 = '012 Cyan Glossy',
  C013 = '013 Red Glossy'
}

export interface AdConfiguration {
  platform: Platform;
  aspectRatio: AspectRatio;
  category: ProductCategory;
  objective: PostObjective;
  coffeeDetails: string;
  atmosphere: string;
  image: string | null;
}

export interface GenerationResult {
  imageUrl: string;
  description: string;
}
