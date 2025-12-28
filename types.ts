
export enum Platform {
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9'
}

export enum ProductCategory {
  PACKAGING = 'Packaging (B2B)',
  EQUIPMENT = 'Equipment (B2C)'
}

export enum BagColor {
  C001 = '001 Kraft Paper',
  C002 = '002 Clear/Frosty',
  C005 = '005 Black Glossy',
  C006 = '006 White Glossy',
  C007 = '007 Black Matte',
  C008 = '008 Brown Matte',
  C011 = '011 Navy Matte'
}

export interface AdConfiguration {
  platform: Platform;
  aspectRatio: AspectRatio;
  category: ProductCategory;
  objective: string;
  coffeeDetails: string;
  atmosphere: string;
  image: string | null;
}

export interface BrandIdentityOutput {
  names: string[];
  logoConcept: string;
  mockupImageUrl: string;
  colors?: string[];
}
