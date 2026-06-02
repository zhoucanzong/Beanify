/**
 * Bead color database for multiple brands
 * Contains ~200 real bead colors across 4 brands + 40 common colors
 */

import type { BeadColor, BrandInfo } from './types';

// Brand definitions
export const BRAND_LIST: BrandInfo[] = [
  { id: 'mard', name: 'MARD (\u56fd\u4ea7)', colors: 60 },
  { id: 'perler', name: 'Perler', colors: 50 },
  { id: 'hama', name: 'Hama', colors: 45 },
  { id: 'artkal', name: 'Artkal', colors: 55 },
];

// ===== MARD brand colors (60 colors) =====
export const MARD_COLORS: BeadColor[] = [
  // Whites & Neutrals
  { id: 'm01', name: '\u96ea\u767d', nameEn: 'White', hex: '#F1F1F1', rgb: [0xf1, 0xf1, 0xf1], brand: 'mard', code: 'A01', isCommon: true },
  { id: 'm02', name: '\u73cd\u73e0\u767d', nameEn: 'Pearl White', hex: '#F0EDE5', rgb: [0xf0, 0xed, 0xe5], brand: 'mard', code: 'A02', isCommon: false },
  { id: 'm03', name: '\u8c61\u7259\u767d', nameEn: 'Ivory', hex: '#F2E8D8', rgb: [0xf2, 0xe8, 0xd8], brand: 'mard', code: 'A03', isCommon: false },
  { id: 'm04', name: '\u4e73\u767d', nameEn: 'Cream', hex: '#FAE3C4', rgb: [0xfa, 0xe3, 0xc4], brand: 'mard', code: 'A04', isCommon: false },
  // Yellows
  { id: 'm05', name: '\u9e2d\u86cb\u9ec4', nameEn: 'Yellow', hex: '#FDE000', rgb: [0xfd, 0xe0, 0x00], brand: 'mard', code: 'B01', isCommon: true },
  { id: 'm06', name: '\u6a59\u9ec4', nameEn: 'Orange Yellow', hex: '#F7B500', rgb: [0xf7, 0xb5, 0x00], brand: 'mard', code: 'B02', isCommon: false },
  { id: 'm07', name: '\u91d1\u9ec4', nameEn: 'Golden Yellow', hex: '#E8A838', rgb: [0xe8, 0xa8, 0x38], brand: 'mard', code: 'B03', isCommon: false },
  { id: 'm08', name: '\u571f\u9ec4', nameEn: 'Mustard', hex: '#C4972E', rgb: [0xc4, 0x97, 0x2e], brand: 'mard', code: 'B04', isCommon: false },
  { id: 'm09', name: '\u51b7\u9ec4', nameEn: 'Lemon Yellow', hex: '#FFF44F', rgb: [0xff, 0xf4, 0x4f], brand: 'mard', code: 'B05', isCommon: false },
  { id: 'm10', name: '\u68d5\u9ec4', nameEn: 'Tan', hex: '#C8A882', rgb: [0xc8, 0xa8, 0x82], brand: 'mard', code: 'B06', isCommon: false },
  // Oranges
  { id: 'm11', name: '\u9c9c\u6a59', nameEn: 'Orange', hex: '#ED6120', rgb: [0xed, 0x61, 0x20], brand: 'mard', code: 'C01', isCommon: true },
  { id: 'm12', name: '\u6df1\u6a59', nameEn: 'Dark Orange', hex: '#D14A20', rgb: [0xd1, 0x4a, 0x20], brand: 'mard', code: 'C02', isCommon: false },
  { id: 'm13', name: '\u6a59\u7ea2', nameEn: 'Red Orange', hex: '#E84638', rgb: [0xe8, 0x46, 0x38], brand: 'mard', code: 'C03', isCommon: false },
  { id: 'm14', name: '\u6a59\u7c89', nameEn: 'Salmon', hex: '#F89883', rgb: [0xf8, 0x98, 0x83], brand: 'mard', code: 'C04', isCommon: false },
  { id: 'm15', name: '\u73ab\u7470\u91d1\u9ec4', nameEn: 'Rose Gold', hex: '#E5A87F', rgb: [0xe5, 0xa8, 0x7f], brand: 'mard', code: 'C05', isCommon: false },
  // Reds
  { id: 'm16', name: '\u5927\u7ea2', nameEn: 'Red', hex: '#E60012', rgb: [0xe6, 0x00, 0x12], brand: 'mard', code: 'D01', isCommon: true },
  { id: 'm17', name: '\u6df1\u7ea2', nameEn: 'Dark Red', hex: '#B81C22', rgb: [0xb8, 0x1c, 0x22], brand: 'mard', code: 'D02', isCommon: false },
  { id: 'm18', name: '\u871c\u6843\u7ea2', nameEn: 'Coral Red', hex: '#F15A4A', rgb: [0xf1, 0x5a, 0x4a], brand: 'mard', code: 'D03', isCommon: false },
  { id: 'm19', name: '\u7ec0\u7ea2', nameEn: 'Crimson', hex: '#9B1B30', rgb: [0x9b, 0x1b, 0x30], brand: 'mard', code: 'D04', isCommon: false },
  { id: 'm20', name: '\u9152\u7ea2', nameEn: 'Wine Red', hex: '#6B2737', rgb: [0x6b, 0x27, 0x37], brand: 'mard', code: 'D05', isCommon: false },
  // Pinks
  { id: 'm21', name: '\u5c11\u5973\u7c89', nameEn: 'Pink', hex: '#E44892', rgb: [0xe4, 0x48, 0x92], brand: 'mard', code: 'E01', isCommon: true },
  { id: 'm22', name: '\u6d45\u7c89', nameEn: 'Light Pink', hex: '#F5AEC9', rgb: [0xf5, 0xae, 0xc9], brand: 'mard', code: 'E02', isCommon: false },
  { id: 'm23', name: '\u6df1\u7c89', nameEn: 'Dark Pink', hex: '#C71585', rgb: [0xc7, 0x15, 0x85], brand: 'mard', code: 'E03', isCommon: false },
  { id: 'm24', name: '\u6843\u7ea2', nameEn: 'Peach Pink', hex: '#F0908D', rgb: [0xf0, 0x90, 0x8d], brand: 'mard', code: 'E04', isCommon: false },
  { id: 'm25', name: '\u6a31\u82b1\u7c89', nameEn: 'Sakura Pink', hex: '#FCC9D2', rgb: [0xfc, 0xc9, 0xd2], brand: 'mard', code: 'E05', isCommon: false },
  // Purples
  { id: 'm26', name: '\u7d2b\u8272', nameEn: 'Purple', hex: '#8C4EBE', rgb: [0x8c, 0x4e, 0xbe], brand: 'mard', code: 'F01', isCommon: true },
  { id: 'm27', name: '\u6df1\u7d2b', nameEn: 'Dark Purple', hex: '#4A0E4E', rgb: [0x4a, 0x0e, 0x4e], brand: 'mard', code: 'F02', isCommon: false },
  { id: 'm28', name: '\u6d45\u7d2b', nameEn: 'Light Purple', hex: '#C49CDC', rgb: [0xc4, 0x9c, 0xdc], brand: 'mard', code: 'F03', isCommon: false },
  { id: 'm29', name: '\u84d1\u84d1\u7d2b', nameEn: 'Lavender', hex: '#AFA4D4', rgb: [0xaf, 0xa4, 0xd4], brand: 'mard', code: 'F04', isCommon: false },
  { id: 'm30', name: '\u8611\u83c7\u7d2b', nameEn: 'Mauve', hex: '#B784A7', rgb: [0xb7, 0x84, 0xa7], brand: 'mard', code: 'F05', isCommon: false },
  // Blues
  { id: 'm31', name: '\u6d77\u84dd', nameEn: 'Blue', hex: '#005CA1', rgb: [0x00, 0x5c, 0xa1], brand: 'mard', code: 'G01', isCommon: true },
  { id: 'm32', name: '\u6df1\u84dd', nameEn: 'Dark Blue', hex: '#1A2B4C', rgb: [0x1a, 0x2b, 0x4c], brand: 'mard', code: 'G02', isCommon: false },
  { id: 'm33', name: '\u5929\u84dd', nameEn: 'Sky Blue', hex: '#5DA5D9', rgb: [0x5d, 0xa5, 0xd9], brand: 'mard', code: 'G03', isCommon: true },
  { id: 'm34', name: '\u6d45\u84dd', nameEn: 'Light Blue', hex: '#A3D6E8', rgb: [0xa3, 0xd6, 0xe8], brand: 'mard', code: 'G04', isCommon: false },
  { id: 'm35', name: '\u5b9d\u84dd', nameEn: 'Royal Blue', hex: '#1E3A6E', rgb: [0x1e, 0x3a, 0x6e], brand: 'mard', code: 'G05', isCommon: false },
  { id: 'm36', name: '\u84dd\u7eff', nameEn: 'Teal', hex: '#007D8E', rgb: [0x00, 0x7d, 0x8e], brand: 'mard', code: 'G06', isCommon: false },
  { id: 'm37', name: '\u5b5d\u7ecf\u84dd', nameEn: 'Cobalt Blue', hex: '#00479D', rgb: [0x00, 0x47, 0x9d], brand: 'mard', code: 'G07', isCommon: false },
  { id: 'm38', name: '\u6e56\u84dd', nameEn: 'Lake Blue', hex: '#4C6CB5', rgb: [0x4c, 0x6c, 0xb5], brand: 'mard', code: 'G08', isCommon: false },
  // Greens
  { id: 'm39', name: '\u8349\u7eff', nameEn: 'Green', hex: '#00A040', rgb: [0x00, 0xa0, 0x40], brand: 'mard', code: 'H01', isCommon: true },
  { id: 'm40', name: '\u6df1\u7eff', nameEn: 'Dark Green', hex: '#005C35', rgb: [0x00, 0x5c, 0x35], brand: 'mard', code: 'H02', isCommon: false },
  { id: 'm41', name: '\u82f9\u679c\u7eff', nameEn: 'Apple Green', hex: '#68BD45', rgb: [0x68, 0xbd, 0x45], brand: 'mard', code: 'H03', isCommon: true },
  { id: 'm42', name: '\u8584\u8377\u7eff', nameEn: 'Mint Green', hex: '#82C5BE', rgb: [0x82, 0xc5, 0xbe], brand: 'mard', code: 'H04', isCommon: false },
  { id: 'm43', name: '\u5f6d\u5c71\u7eff', nameEn: 'Pastel Green', hex: '#B9D58B', rgb: [0xb9, 0xd5, 0x8b], brand: 'mard', code: 'H05', isCommon: false },
  { id: 'm44', name: '\u5ae9\u7eff', nameEn: 'Neon Green', hex: '#32CD32', rgb: [0x32, 0xcd, 0x32], brand: 'mard', code: 'H06', isCommon: false },
  { id: 'm45', name: '\u84dd\u7eff\u8272', nameEn: 'Aqua', hex: '#71C1D0', rgb: [0x71, 0xc1, 0xd0], brand: 'mard', code: 'H07', isCommon: false },
  // Browns
  { id: 'm46', name: '\u5496\u55b1', nameEn: 'Brown', hex: '#5A3A29', rgb: [0x5a, 0x3a, 0x29], brand: 'mard', code: 'I01', isCommon: true },
  { id: 'm47', name: '\u6df1\u68d5', nameEn: 'Dark Brown', hex: '#3E2723', rgb: [0x3e, 0x27, 0x23], brand: 'mard', code: 'I02', isCommon: false },
  { id: 'm48', name: '\u6d45\u68d5', nameEn: 'Light Brown', hex: '#A08B7B', rgb: [0xa0, 0x8b, 0x7b], brand: 'mard', code: 'I03', isCommon: false },
  { id: 'm49', name: '\u6a61\u76ae\u68d5', nameEn: 'Tan Brown', hex: '#8B6D5C', rgb: [0x8b, 0x6d, 0x5c], brand: 'mard', code: 'I04', isCommon: false },
  { id: 'm50', name: '\u99ac\u9b54\u68d5', nameEn: 'Chestnut', hex: '#6E4536', rgb: [0x6e, 0x45, 0x36], brand: 'mard', code: 'I05', isCommon: false },
  // Greys
  { id: 'm51', name: '\u6d45\u7070', nameEn: 'Light Gray', hex: '#C9CACA', rgb: [0xc9, 0xca, 0xca], brand: 'mard', code: 'J01', isCommon: false },
  { id: 'm52', name: '\u4e2d\u7070', nameEn: 'Gray', hex: '#8A8D91', rgb: [0x8a, 0x8d, 0x91], brand: 'mard', code: 'J02', isCommon: true },
  { id: 'm53', name: '\u6df1\u7070', nameEn: 'Dark Gray', hex: '#4F5052', rgb: [0x4f, 0x50, 0x52], brand: 'mard', code: 'J03', isCommon: false },
  { id: 'm54', name: '\u94c1\u7070', nameEn: 'Iron Gray', hex: '#6B6D72', rgb: [0x6b, 0x6d, 0x72], brand: 'mard', code: 'J04', isCommon: false },
  { id: 'm55', name: '\u94f6\u7070', nameEn: 'Silver', hex: '#B8BCC0', rgb: [0xb8, 0xbc, 0xc0], brand: 'mard', code: 'J05', isCommon: false },
  // Skin tones
  { id: 'm56', name: '\u80a4\u8272', nameEn: 'Skin Tone', hex: '#E8B89D', rgb: [0xe8, 0xb8, 0x9d], brand: 'mard', code: 'K01', isCommon: true },
  { id: 'm57', name: '\u5c0f\u9ea6\u8272', nameEn: 'Wheat', hex: '#D4A574', rgb: [0xd4, 0xa5, 0x74], brand: 'mard', code: 'K02', isCommon: false },
  { id: 'm58', name: '\u53e4\u94dc\u8272', nameEn: 'Bronze', hex: '#C68E5F', rgb: [0xc6, 0x8e, 0x5f], brand: 'mard', code: 'K03', isCommon: false },
  { id: 'm59', name: '\u9ed1\u8272', nameEn: 'Black', hex: '#2E2F32', rgb: [0x2e, 0x2f, 0x32], brand: 'mard', code: 'L01', isCommon: true },
  { id: 'm60', name: '\u7eaf\u767d', nameEn: 'Pure White', hex: '#FFFFFF', rgb: [0xff, 0xff, 0xff], brand: 'mard', code: 'A00', isCommon: false },
];

// ===== Perler brand colors (50 colors) =====
export const PERLER_COLORS: BeadColor[] = [
  { id: 'p01', name: 'White', nameEn: 'White', hex: '#F0F0F0', rgb: [0xf0, 0xf0, 0xf0], brand: 'perler', code: 'P01', isCommon: true },
  { id: 'p02', name: 'Light Brown', nameEn: 'Light Brown', hex: '#C8A882', rgb: [0xc8, 0xa8, 0x82], brand: 'perler', code: 'P26', isCommon: false },
  { id: 'p03', name: 'Cream', nameEn: 'Cream', hex: '#F5E6D3', rgb: [0xf5, 0xe6, 0xd3], brand: 'perler', code: 'P02', isCommon: false },
  { id: 'p04', name: 'Peach', nameEn: 'Peach', hex: '#F5C6B6', rgb: [0xf5, 0xc6, 0xb6], brand: 'perler', code: 'P27', isCommon: true },
  { id: 'p05', name: 'Yellow', nameEn: 'Yellow', hex: '#FFF200', rgb: [0xff, 0xf2, 0x00], brand: 'perler', code: 'P03', isCommon: true },
  { id: 'p06', name: 'Cheddar', nameEn: 'Cheddar', hex: '#F9A72B', rgb: [0xf9, 0xa7, 0x2b], brand: 'perler', code: 'P55', isCommon: false },
  { id: 'p07', name: 'Butterscotch', nameEn: 'Butterscotch', hex: '#E89B54', rgb: [0xe8, 0x9b, 0x54], brand: 'perler', code: 'P54', isCommon: false },
  { id: 'p08', name: 'Orange', nameEn: 'Orange', hex: '#FF7F00', rgb: [0xff, 0x7f, 0x00], brand: 'perler', code: 'P04', isCommon: true },
  { id: 'p09', name: 'Red', nameEn: 'Red', hex: '#E30022', rgb: [0xe3, 0x00, 0x22], brand: 'perler', code: 'P05', isCommon: true },
  { id: 'p10', name: 'Rust', nameEn: 'Rust', hex: '#B33808', rgb: [0xb3, 0x38, 0x08], brand: 'perler', code: 'P84', isCommon: false },
  { id: 'p11', name: 'Bubblegum', nameEn: 'Bubblegum', hex: '#F46D8D', rgb: [0xf4, 0x6d, 0x8d], brand: 'perler', code: 'P29', isCommon: true },
  { id: 'p12', name: 'Pink', nameEn: 'Pink', hex: '#FF99CC', rgb: [0xff, 0x99, 0xcc], brand: 'perler', code: 'P83', isCommon: true },
  { id: 'p13', name: 'Hot Coral', nameEn: 'Hot Coral', hex: '#F53548', rgb: [0xf5, 0x35, 0x48], brand: 'perler', code: 'P85', isCommon: false },
  { id: 'p14', name: 'Plum', nameEn: 'Plum', hex: '#6B3D6B', rgb: [0x6b, 0x3d, 0x6b], brand: 'perler', code: 'P43', isCommon: false },
  { id: 'p15', name: 'Purple', nameEn: 'Purple', hex: '#6B52A3', rgb: [0x6b, 0x52, 0xa3], brand: 'perler', code: 'P06', isCommon: true },
  { id: 'p16', name: 'Dark Blue', nameEn: 'Dark Blue', hex: '#1A2B6D', rgb: [0x1a, 0x2b, 0x6d], brand: 'perler', code: 'P07', isCommon: false },
  { id: 'p17', name: 'Pastel Blue', nameEn: 'Pastel Blue', hex: '#9BC4E2', rgb: [0x9b, 0xc4, 0xe2], brand: 'perler', code: 'P79', isCommon: false },
  { id: 'p18', name: 'Light Blue', nameEn: 'Light Blue', hex: '#6BB5D8', rgb: [0x6b, 0xb5, 0xd8], brand: 'perler', code: 'P80', isCommon: false },
  { id: 'p19', name: 'Bluestripe', nameEn: 'Bluestripe', hex: '#2E5090', rgb: [0x2e, 0x50, 0x90], brand: 'perler', code: 'P08', isCommon: false },
  { id: 'p20', name: 'Cobalt', nameEn: 'Cobalt', hex: '#004B8D', rgb: [0x00, 0x4b, 0x8d], brand: 'perler', code: 'P09', isCommon: false },
  { id: 'p21', name: 'Evergreen', nameEn: 'Evergreen', hex: '#005D46', rgb: [0x00, 0x5d, 0x46], brand: 'perler', code: 'P39', isCommon: false },
  { id: 'p22', name: 'Green', nameEn: 'Green', hex: '#00A651', rgb: [0x00, 0xa6, 0x51], brand: 'perler', code: 'P10', isCommon: true },
  { id: 'p23', name: 'Lime Green', nameEn: 'Lime Green', hex: '#76C043', rgb: [0x76, 0xc0, 0x43], brand: 'perler', code: 'P40', isCommon: false },
  { id: 'p24', name: 'Pastel Green', nameEn: 'Pastel Green', hex: '#A9D9A7', rgb: [0xa9, 0xd9, 0xa7], brand: 'perler', code: 'P78', isCommon: false },
  { id: 'p25', name: 'Mint', nameEn: 'Mint', hex: '#7FCEBB', rgb: [0x7f, 0xce, 0xbb], brand: 'perler', code: 'P44', isCommon: false },
  { id: 'p26', name: 'Light Green', nameEn: 'Light Green', hex: '#B5D6A8', rgb: [0xb5, 0xd6, 0xa8], brand: 'perler', code: 'P81', isCommon: false },
  { id: 'p27', name: 'Brown', nameEn: 'Brown', hex: '#5A3A29', rgb: [0x5a, 0x3a, 0x29], brand: 'perler', code: 'P12', isCommon: true },
  { id: 'p28', name: 'Dark Brown', nameEn: 'Dark Brown', hex: '#3E2723', rgb: [0x3e, 0x27, 0x23], brand: 'perler', code: 'P90', isCommon: false },
  { id: 'p29', name: 'Grey', nameEn: 'Grey', hex: '#8A8D91', rgb: [0x8a, 0x8d, 0x91], brand: 'perler', code: 'P17', isCommon: true },
  { id: 'p30', name: 'Dark Grey', nameEn: 'Dark Grey', hex: '#4A4A4C', rgb: [0x4a, 0x4a, 0x4c], brand: 'perler', code: 'P91', isCommon: false },
  { id: 'p31', name: 'Black', nameEn: 'Black', hex: '#1A1A1A', rgb: [0x1a, 0x1a, 0x1a], brand: 'perler', code: 'P18', isCommon: true },
  { id: 'p32', name: 'Beige', nameEn: 'Beige', hex: '#D6C6A0', rgb: [0xd6, 0xc6, 0xa0], brand: 'perler', code: 'P53', isCommon: false },
  { id: 'p33', name: 'Light Pink', nameEn: 'Light Pink', hex: '#F2C2C4', rgb: [0xf2, 0xc2, 0xc4], brand: 'perler', code: 'P82', isCommon: false },
  { id: 'p34', name: 'Toothpaste', nameEn: 'Toothpaste', hex: '#A5E2D9', rgb: [0xa5, 0xe2, 0xd9], brand: 'perler', code: 'P48', isCommon: false },
  { id: 'p35', name: 'Fuchsia', nameEn: 'Fuchsia', hex: '#B32882', rgb: [0xb3, 0x28, 0x82], brand: 'perler', code: 'P56', isCommon: false },
  { id: 'p36', name: 'Turquoise', nameEn: 'Turquoise', hex: '#00A8A8', rgb: [0x00, 0xa8, 0xa8], brand: 'perler', code: 'P47', isCommon: false },
  { id: 'p37', name: 'Royal Blue', nameEn: 'Royal Blue', hex: '#174289', rgb: [0x17, 0x42, 0x89], brand: 'perler', code: 'P69', isCommon: false },
  { id: 'p38', name: 'Sand', nameEn: 'Sand', hex: '#CABBA2', rgb: [0xca, 0xbb, 0xa2], brand: 'perler', code: 'P45', isCommon: false },
  { id: 'p39', name: 'Tan', nameEn: 'Tan', hex: '#A69076', rgb: [0xa6, 0x90, 0x76], brand: 'perler', code: 'P46', isCommon: false },
  { id: 'p40', name: 'Salmon', nameEn: 'Salmon', hex: '#E87D6B', rgb: [0xe8, 0x7d, 0x6b], brand: 'perler', code: 'P96', isCommon: false },
  { id: 'p41', name: 'Slate Blue', nameEn: 'Slate Blue', hex: '#4E6590', rgb: [0x4e, 0x65, 0x90], brand: 'perler', code: 'P41', isCommon: false },
  { id: 'p42', name: 'Magenta', nameEn: 'Magenta', hex: '#A8336A', rgb: [0xa8, 0x33, 0x6a], brand: 'perler', code: 'P42', isCommon: false },
  { id: 'p43', name: 'Kiwi Lime', nameEn: 'Kiwi Lime', hex: '#8CC63F', rgb: [0x8c, 0xc6, 0x3f], brand: 'perler', code: 'P74', isCommon: false },
  { id: 'p44', name: 'Blueberry Cream', nameEn: 'Blueberry Cream', hex: '#7B9CC4', rgb: [0x7b, 0x9c, 0xc4], brand: 'perler', code: 'P77', isCommon: false },
  { id: 'p45', name: 'Blush', nameEn: 'Blush', hex: '#E89EA0', rgb: [0xe8, 0x9e, 0xa0], brand: 'perler', code: 'P30', isCommon: false },
  { id: 'p46', name: 'Grape', nameEn: 'Grape', hex: '#4A3084', rgb: [0x4a, 0x30, 0x84], brand: 'perler', code: 'P38', isCommon: false },
  { id: 'p47', name: 'Light Lavender', nameEn: 'Light Lavender', hex: '#BDA0CA', rgb: [0xbd, 0xa0, 0xca], brand: 'perler', code: 'P86', isCommon: false },
  { id: 'p48', name: 'Pewter', nameEn: 'Pewter', hex: '#708298', rgb: [0x70, 0x82, 0x98], brand: 'perler', code: 'P92', isCommon: false },
  { id: 'p49', name: 'Honey', nameEn: 'Honey', hex: '#D9A648', rgb: [0xd9, 0xa6, 0x48], brand: 'perler', code: 'P93', isCommon: false },
  { id: 'p50', name: 'Gold', nameEn: 'Gold', hex: '#C4A545', rgb: [0xc4, 0xa5, 0x45], brand: 'perler', code: 'P94', isCommon: false },
];

// ===== Hama brand colors (45 colors) =====
export const HAMA_COLORS: BeadColor[] = [
  { id: 'h01', name: 'White', nameEn: 'White', hex: '#F0F0F0', rgb: [0xf0, 0xf0, 0xf0], brand: 'hama', code: 'H01', isCommon: true },
  { id: 'h02', name: 'Cream', nameEn: 'Cream', hex: '#F5E6D3', rgb: [0xf5, 0xe6, 0xd3], brand: 'hama', code: 'H02', isCommon: false },
  { id: 'h03', name: 'Yellow', nameEn: 'Yellow', hex: '#FFE500', rgb: [0xff, 0xe5, 0x00], brand: 'hama', code: 'H03', isCommon: true },
  { id: 'h04', name: 'Orange', nameEn: 'Orange', hex: '#FF6600', rgb: [0xff, 0x66, 0x00], brand: 'hama', code: 'H04', isCommon: true },
  { id: 'h05', name: 'Red', nameEn: 'Red', hex: '#E2001A', rgb: [0xe2, 0x00, 0x1a], brand: 'hama', code: 'H05', isCommon: true },
  { id: 'h06', name: 'Pink', nameEn: 'Pink', hex: '#E89EC4', rgb: [0xe8, 0x9e, 0xc4], brand: 'hama', code: 'H06', isCommon: true },
  { id: 'h07', name: 'Purple', nameEn: 'Purple', hex: '#6B3FA0', rgb: [0x6b, 0x3f, 0xa0], brand: 'hama', code: 'H07', isCommon: true },
  { id: 'h08', name: 'Blue', nameEn: 'Blue', hex: '#0048BA', rgb: [0x00, 0x48, 0xba], brand: 'hama', code: 'H08', isCommon: true },
  { id: 'h09', name: 'Light Blue', nameEn: 'Light Blue', hex: '#6BB5D8', rgb: [0x6b, 0xb5, 0xd8], brand: 'hama', code: 'H09', isCommon: false },
  { id: 'h10', name: 'Green', nameEn: 'Green', hex: '#00A651', rgb: [0x00, 0xa6, 0x51], brand: 'hama', code: 'H10', isCommon: true },
  { id: 'h11', name: 'Light Green', nameEn: 'Light Green', hex: '#B5D6A8', rgb: [0xb5, 0xd6, 0xa8], brand: 'hama', code: 'H11', isCommon: false },
  { id: 'h12', name: 'Brown', nameEn: 'Brown', hex: '#5A3A29', rgb: [0x5a, 0x3a, 0x29], brand: 'hama', code: 'H12', isCommon: true },
  { id: 'h13', name: 'Beige', nameEn: 'Beige', hex: '#D6C6A0', rgb: [0xd6, 0xc6, 0xa0], brand: 'hama', code: 'H13', isCommon: false },
  { id: 'h14', name: 'Grey', nameEn: 'Grey', hex: '#8A8D91', rgb: [0x8a, 0x8d, 0x91], brand: 'hama', code: 'H17', isCommon: true },
  { id: 'h15', name: 'Black', nameEn: 'Black', hex: '#1A1A1A', rgb: [0x1a, 0x1a, 0x1a], brand: 'hama', code: 'H18', isCommon: true },
  { id: 'h16', name: 'Reddish Brown', nameEn: 'Reddish Brown', hex: '#8B4513', rgb: [0x8b, 0x45, 0x13], brand: 'hama', code: 'H20', isCommon: false },
  { id: 'h17', name: 'Light Brown', nameEn: 'Light Brown', hex: '#C8A882', rgb: [0xc8, 0xa8, 0x82], brand: 'hama', code: 'H21', isCommon: false },
  { id: 'h18', name: 'Beige (alt)', nameEn: 'Beige', hex: '#D4C4A0', rgb: [0xd4, 0xc4, 0xa0], brand: 'hama', code: 'H22', isCommon: false },
  { id: 'h19', name: 'Pastel Yellow', nameEn: 'Pastel Yellow', hex: '#FFF5B8', rgb: [0xff, 0xf5, 0xb8], brand: 'hama', code: 'H19', isCommon: false },
  { id: 'h20', name: 'Pastel Red', nameEn: 'Pastel Red', hex: '#F4A2A0', rgb: [0xf4, 0xa2, 0xa0], brand: 'hama', code: 'H27', isCommon: false },
  { id: 'h21', name: 'Pastel Purple', nameEn: 'Pastel Purple', hex: '#C4B5D8', rgb: [0xc4, 0xb5, 0xd8], brand: 'hama', code: 'H25', isCommon: false },
  { id: 'h22', name: 'Pastel Blue', nameEn: 'Pastel Blue', hex: '#B5CFE0', rgb: [0xb5, 0xcf, 0xe0], brand: 'hama', code: 'H23', isCommon: false },
  { id: 'h23', name: 'Pastel Green', nameEn: 'Pastel Green', hex: '#B8D6B8', rgb: [0xb8, 0xd6, 0xb8], brand: 'hama', code: 'H24', isCommon: false },
  { id: 'h24', name: 'Pastel Pink', nameEn: 'Pastel Pink', hex: '#F8D8E0', rgb: [0xf8, 0xd8, 0xe0], brand: 'hama', code: 'H28', isCommon: false },
  { id: 'h25', name: 'Neon Yellow', nameEn: 'Neon Yellow', hex: '#E8F248', rgb: [0xe8, 0xf2, 0x48], brand: 'hama', code: 'H32', isCommon: false },
  { id: 'h26', name: 'Neon Orange', nameEn: 'Neon Orange', hex: '#FF8428', rgb: [0xff, 0x84, 0x28], brand: 'hama', code: 'H31', isCommon: false },
  { id: 'h27', name: 'Neon Green', nameEn: 'Neon Green', hex: '#54C228', rgb: [0x54, 0xc2, 0x28], brand: 'hama', code: 'H30', isCommon: false },
  { id: 'h28', name: 'Neon Pink', nameEn: 'Neon Pink', hex: '#FF54A0', rgb: [0xff, 0x54, 0xa0], brand: 'hama', code: 'H29', isCommon: false },
  { id: 'h29', name: 'Turquoise', nameEn: 'Turquoise', hex: '#00A0A8', rgb: [0x00, 0xa0, 0xa8], brand: 'hama', code: 'H15', isCommon: false },
  { id: 'h30', name: 'Fuchsia', nameEn: 'Fuchsia', hex: '#C02878', rgb: [0xc0, 0x28, 0x78], brand: 'hama', code: 'H14', isCommon: false },
  { id: 'h31', name: 'Burgundy', nameEn: 'Burgundy', hex: '#8B1A42', rgb: [0x8b, 0x1a, 0x42], brand: 'hama', code: 'H83', isCommon: false },
  { id: 'h32', name: 'Plum', nameEn: 'Plum', hex: '#6B3D6B', rgb: [0x6b, 0x3d, 0x6b], brand: 'hama', code: 'H85', isCommon: false },
  { id: 'h33', name: 'Dark Green', nameEn: 'Dark Green', hex: '#1A5C2E', rgb: [0x1a, 0x5c, 0x2e], brand: 'hama', code: 'H11', isCommon: false },
  { id: 'h34', name: 'Cobalt Blue', nameEn: 'Cobalt Blue', hex: '#0045A2', rgb: [0x00, 0x45, 0xa2], brand: 'hama', code: 'H86', isCommon: false },
  { id: 'h35', name: 'Lavender', nameEn: 'Lavender', hex: '#A89CD4', rgb: [0xa8, 0x9c, 0xd4], brand: 'hama', code: 'H84', isCommon: false },
  { id: 'h36', name: 'Skin Tone', nameEn: 'Skin Tone', hex: '#E8C4A8', rgb: [0xe8, 0xc4, 0xa8], brand: 'hama', code: 'H78', isCommon: true },
  { id: 'h37', name: 'Gold', nameEn: 'Gold', hex: '#C8A838', rgb: [0xc8, 0xa8, 0x38], brand: 'hama', code: 'H87', isCommon: false },
  { id: 'h38', name: 'Silver', nameEn: 'Silver', hex: '#B0B4B8', rgb: [0xb0, 0xb4, 0xb8], brand: 'hama', code: 'H88', isCommon: false },
  { id: 'h39', name: 'Light Grey', nameEn: 'Light Grey', hex: '#C8CACC', rgb: [0xc8, 0xca, 0xcc], brand: 'hama', code: 'H89', isCommon: false },
  { id: 'h40', name: 'Dark Red', nameEn: 'Dark Red', hex: '#B81C22', rgb: [0xb8, 0x1c, 0x22], brand: 'hama', code: 'H90', isCommon: false },
  { id: 'h41', name: 'Azure', nameEn: 'Azure', hex: '#0070C0', rgb: [0x00, 0x70, 0xc0], brand: 'hama', code: 'H91', isCommon: false },
  { id: 'h42', name: 'Sand', nameEn: 'Sand', hex: '#C4B094', rgb: [0xc4, 0xb0, 0x94], brand: 'hama', code: 'H92', isCommon: false },
  { id: 'h43', name: 'Raspberry', nameEn: 'Raspberry', hex: '#B82E5C', rgb: [0xb8, 0x2e, 0x5c], brand: 'hama', code: 'H93', isCommon: false },
  { id: 'h44', name: 'Forest Green', nameEn: 'Forest Green', hex: '#2E5C00', rgb: [0x2e, 0x5c, 0x00], brand: 'hama', code: 'H94', isCommon: false },
  { id: 'h45', name: 'Ivory', nameEn: 'Ivory', hex: '#F0ECDC', rgb: [0xf0, 0xec, 0xdc], brand: 'hama', code: 'H95', isCommon: false },
];

// ===== Artkal brand colors (55 colors) =====
export const ARTKAL_COLORS: BeadColor[] = [
  { id: 'a01', name: 'White', nameEn: 'White', hex: '#F0F0F0', rgb: [0xf0, 0xf0, 0xf0], brand: 'artkal', code: 'S01', isCommon: true },
  { id: 'a02', name: 'Cream', nameEn: 'Cream', hex: '#F5E6D3', rgb: [0xf5, 0xe6, 0xd3], brand: 'artkal', code: 'S02', isCommon: false },
  { id: 'a03', name: 'Yellow', nameEn: 'Yellow', hex: '#F8D030', rgb: [0xf8, 0xd0, 0x30], brand: 'artkal', code: 'S27', isCommon: true },
  { id: 'a04', name: 'Orange', nameEn: 'Orange', hex: '#F07038', rgb: [0xf0, 0x70, 0x38], brand: 'artkal', code: 'S04', isCommon: true },
  { id: 'a05', name: 'Red', nameEn: 'Red', hex: '#E03030', rgb: [0xe0, 0x30, 0x30], brand: 'artkal', code: 'S05', isCommon: true },
  { id: 'a06', name: 'Pink', nameEn: 'Pink', hex: '#F0A0C0', rgb: [0xf0, 0xa0, 0xc0], brand: 'artkal', code: 'S25', isCommon: true },
  { id: 'a07', name: 'Purple', nameEn: 'Purple', hex: '#7030A0', rgb: [0x70, 0x30, 0xa0], brand: 'artkal', code: 'S22', isCommon: true },
  { id: 'a08', name: 'Blue', nameEn: 'Blue', hex: '#2050B0', rgb: [0x20, 0x50, 0xb0], brand: 'artkal', code: 'S11', isCommon: true },
  { id: 'a09', name: 'Light Blue', nameEn: 'Light Blue', hex: '#78B8E0', rgb: [0x78, 0xb8, 0xe0], brand: 'artkal', code: 'S09', isCommon: false },
  { id: 'a10', name: 'Green', nameEn: 'Green', hex: '#30A848', rgb: [0x30, 0xa8, 0x48], brand: 'artkal', code: 'S20', isCommon: true },
  { id: 'a11', name: 'Light Green', nameEn: 'Light Green', hex: '#A8D8A0', rgb: [0xa8, 0xd8, 0xa0], brand: 'artkal', code: 'S21', isCommon: false },
  { id: 'a12', name: 'Brown', nameEn: 'Brown', hex: '#684830', rgb: [0x68, 0x48, 0x30], brand: 'artkal', code: 'S16', isCommon: true },
  { id: 'a13', name: 'Grey', nameEn: 'Grey', hex: '#808080', rgb: [0x80, 0x80, 0x80], brand: 'artkal', code: 'S07', isCommon: true },
  { id: 'a14', name: 'Black', nameEn: 'Black', hex: '#202020', rgb: [0x20, 0x20, 0x20], brand: 'artkal', code: 'S13', isCommon: true },
  { id: 'a15', name: 'Ivory', nameEn: 'Ivory', hex: '#F0E8D8', rgb: [0xf0, 0xe8, 0xd8], brand: 'artkal', code: 'S77', isCommon: false },
  { id: 'a16', name: 'Beige', nameEn: 'Beige', hex: '#D8C8A8', rgb: [0xd8, 0xc8, 0xa8], brand: 'artkal', code: 'S78', isCommon: false },
  { id: 'a17', name: 'Skin', nameEn: 'Skin', hex: '#F0C8A8', rgb: [0xf0, 0xc8, 0xa8], brand: 'artkal', code: 'S94', isCommon: true },
  { id: 'a18', name: 'Light Brown', nameEn: 'Light Brown', hex: '#A08860', rgb: [0xa0, 0x88, 0x60], brand: 'artkal', code: 'S81', isCommon: false },
  { id: 'a19', name: 'Light Pink', nameEn: 'Light Pink', hex: '#F8D0D8', rgb: [0xf8, 0xd0, 0xd8], brand: 'artkal', code: 'S95', isCommon: false },
  { id: 'a20', name: 'Rose', nameEn: 'Rose', hex: '#D86080', rgb: [0xd8, 0x60, 0x80], brand: 'artkal', code: 'S96', isCommon: false },
  { id: 'a21', name: 'Magenta', nameEn: 'Magenta', hex: '#B82078', rgb: [0xb8, 0x20, 0x78], brand: 'artkal', code: 'S97', isCommon: false },
  { id: 'a22', name: 'Lavender', nameEn: 'Lavender', hex: '#A890C8', rgb: [0xa8, 0x90, 0xc8], brand: 'artkal', code: 'S98', isCommon: false },
  { id: 'a23', name: 'Sky Blue', nameEn: 'Sky Blue', hex: '#60B0E0', rgb: [0x60, 0xb0, 0xe0], brand: 'artkal', code: 'S99', isCommon: false },
  { id: 'a24', name: 'Navy', nameEn: 'Navy', hex: '#182860', rgb: [0x18, 0x28, 0x60], brand: 'artkal', code: 'S100', isCommon: false },
  { id: 'a25', name: 'Teal', nameEn: 'Teal', hex: '#007878', rgb: [0x00, 0x78, 0x78], brand: 'artkal', code: 'S101', isCommon: false },
  { id: 'a26', name: 'Aqua', nameEn: 'Aqua', hex: '#50C0C0', rgb: [0x50, 0xc0, 0xc0], brand: 'artkal', code: 'S102', isCommon: false },
  { id: 'a27', name: 'Lime', nameEn: 'Lime', hex: '#78C848', rgb: [0x78, 0xc8, 0x48], brand: 'artkal', code: 'S103', isCommon: false },
  { id: 'a28', name: 'Mint', nameEn: 'Mint', hex: '#88D8C0', rgb: [0x88, 0xd8, 0xc0], brand: 'artkal', code: 'S104', isCommon: false },
  { id: 'a29', name: 'Forest Green', nameEn: 'Forest Green', hex: '#206028', rgb: [0x20, 0x60, 0x28], brand: 'artkal', code: 'S105', isCommon: false },
  { id: 'a30', name: 'Dark Brown', nameEn: 'Dark Brown', hex: '#483020', rgb: [0x48, 0x30, 0x20], brand: 'artkal', code: 'S106', isCommon: false },
  { id: 'a31', name: 'Gold', nameEn: 'Gold', hex: '#C0A030', rgb: [0xc0, 0xa0, 0x30], brand: 'artkal', code: 'S107', isCommon: false },
  { id: 'a32', name: 'Silver', nameEn: 'Silver', hex: '#B8B8B8', rgb: [0xb8, 0xb8, 0xb8], brand: 'artkal', code: 'S108', isCommon: false },
  { id: 'a33', name: 'Dark Grey', nameEn: 'Dark Grey', hex: '#484848', rgb: [0x48, 0x48, 0x48], brand: 'artkal', code: 'S109', isCommon: false },
  { id: 'a34', name: 'Light Grey', nameEn: 'Light Grey', hex: '#C0C0C0', rgb: [0xc0, 0xc0, 0xc0], brand: 'artkal', code: 'S110', isCommon: false },
  { id: 'a35', name: 'Hot Pink', nameEn: 'Hot Pink', hex: '#F05080', rgb: [0xf0, 0x50, 0x80], brand: 'artkal', code: 'S111', isCommon: false },
  { id: 'a36', name: 'Coral', nameEn: 'Coral', hex: '#F07868', rgb: [0xf0, 0x78, 0x68], brand: 'artkal', code: 'S112', isCommon: false },
  { id: 'a37', name: 'Sunset', nameEn: 'Sunset', hex: '#F89850', rgb: [0xf8, 0x98, 0x50], brand: 'artkal', code: 'S113', isCommon: false },
  { id: 'a38', name: 'Lemon', nameEn: 'Lemon', hex: '#F8F050', rgb: [0xf8, 0xf0, 0x50], brand: 'artkal', code: 'S114', isCommon: false },
  { id: 'a39', name: 'Pastel Pink', nameEn: 'Pastel Pink', hex: '#F8D0D8', rgb: [0xf8, 0xd0, 0xd8], brand: 'artkal', code: 'S115', isCommon: false },
  { id: 'a40', name: 'Pastel Blue', nameEn: 'Pastel Blue', hex: '#C0D8F0', rgb: [0xc0, 0xd8, 0xf0], brand: 'artkal', code: 'S116', isCommon: false },
  { id: 'a41', name: 'Pastel Green', nameEn: 'Pastel Green', hex: '#C0E8C0', rgb: [0xc0, 0xe8, 0xc0], brand: 'artkal', code: 'S117', isCommon: false },
  { id: 'a42', name: 'Pastel Yellow', nameEn: 'Pastel Yellow', hex: '#F8F0C0', rgb: [0xf8, 0xf0, 0xc0], brand: 'artkal', code: 'S118', isCommon: false },
  { id: 'a43', name: 'Pastel Purple', nameEn: 'Pastel Purple', hex: '#D0C0E0', rgb: [0xd0, 0xc0, 0xe0], brand: 'artkal', code: 'S119', isCommon: false },
  { id: 'a44', name: 'Bright Red', nameEn: 'Bright Red', hex: '#E81028', rgb: [0xe8, 0x10, 0x28], brand: 'artkal', code: 'S120', isCommon: false },
  { id: 'a45', name: 'Bright Yellow', nameEn: 'Bright Yellow', hex: '#F8E008', rgb: [0xf8, 0xe0, 0x08], brand: 'artkal', code: 'S121', isCommon: false },
  { id: 'a46', name: 'Bright Green', nameEn: 'Bright Green', hex: '#28C828', rgb: [0x28, 0xc8, 0x28], brand: 'artkal', code: 'S122', isCommon: false },
  { id: 'a47', name: 'Bright Blue', nameEn: 'Bright Blue', hex: '#2058E8', rgb: [0x20, 0x58, 0xe8], brand: 'artkal', code: 'S123', isCommon: false },
  { id: 'a48', name: 'Cherry', nameEn: 'Cherry', hex: '#A01830', rgb: [0xa0, 0x18, 0x30], brand: 'artkal', code: 'S124', isCommon: false },
  { id: 'a49', name: 'Cobalt', nameEn: 'Cobalt', hex: '#0038A8', rgb: [0x00, 0x38, 0xa8], brand: 'artkal', code: 'S125', isCommon: false },
  { id: 'a50', name: 'Olive', nameEn: 'Olive', hex: '#788028', rgb: [0x78, 0x80, 0x28], brand: 'artkal', code: 'S126', isCommon: false },
  { id: 'a51', name: 'Sand', nameEn: 'Sand', hex: '#C0A880', rgb: [0xc0, 0xa8, 0x80], brand: 'artkal', code: 'S127', isCommon: false },
  { id: 'a52', name: 'Peach', nameEn: 'Peach', hex: '#F0B8A0', rgb: [0xf0, 0xb8, 0xa0], brand: 'artkal', code: 'S128', isCommon: true },
  { id: 'a53', name: 'Dark Red', nameEn: 'Dark Red', hex: '#801820', rgb: [0x80, 0x18, 0x20], brand: 'artkal', code: 'S129', isCommon: false },
  { id: 'a54', name: 'Light Purple', nameEn: 'Light Purple', hex: '#B898D8', rgb: [0xb8, 0x98, 0xd8], brand: 'artkal', code: 'S130', isCommon: false },
  { id: 'a55', name: 'Turquoise', nameEn: 'Turquoise', hex: '#48B8B8', rgb: [0x48, 0xb8, 0xb8], brand: 'artkal', code: 'S131', isCommon: false },
];

// ===== Common colors (40 most-used bead colors across all brands) =====
export const COMMON_COLORS: BeadColor[] = [
  // White & Black
  { id: 'mc01', name: '\u96ea\u767d', nameEn: 'White', hex: '#F1F1F1', rgb: [0xf1, 0xf1, 0xf1], brand: 'common', code: 'WHT', isCommon: true },
  { id: 'mc02', name: '\u7eaf\u9ed1', nameEn: 'Black', hex: '#2E2F32', rgb: [0x2e, 0x2f, 0x32], brand: 'common', code: 'BLK', isCommon: true },
  // Reds
  { id: 'mc03', name: '\u5927\u7ea2', nameEn: 'Red', hex: '#E60012', rgb: [0xe6, 0x00, 0x12], brand: 'common', code: 'RED', isCommon: true },
  { id: 'mc04', name: '\u6df1\u7ea2', nameEn: 'Dark Red', hex: '#B81C22', rgb: [0xb8, 0x1c, 0x22], brand: 'common', code: 'DRD', isCommon: true },
  // Yellows
  { id: 'mc05', name: '\u9e2d\u86cb\u9ec4', nameEn: 'Yellow', hex: '#FDE000', rgb: [0xfd, 0xe0, 0x00], brand: 'common', code: 'YEL', isCommon: true },
  { id: 'mc06', name: '\u91d1\u9ec4', nameEn: 'Gold', hex: '#E8A838', rgb: [0xe8, 0xa8, 0x38], brand: 'common', code: 'GLD', isCommon: true },
  // Blues
  { id: 'mc07', name: '\u6d77\u84dd', nameEn: 'Blue', hex: '#005CA1', rgb: [0x00, 0x5c, 0xa1], brand: 'common', code: 'BLU', isCommon: true },
  { id: 'mc08', name: '\u5929\u84dd', nameEn: 'Sky Blue', hex: '#5DA5D9', rgb: [0x5d, 0xa5, 0xd9], brand: 'common', code: 'SKY', isCommon: true },
  { id: 'mc09', name: '\u6df1\u84dd', nameEn: 'Navy', hex: '#1A2B4C', rgb: [0x1a, 0x2b, 0x4c], brand: 'common', code: 'NVY', isCommon: true },
  // Greens
  { id: 'mc10', name: '\u8349\u7eff', nameEn: 'Green', hex: '#00A040', rgb: [0x00, 0xa0, 0x40], brand: 'common', code: 'GRN', isCommon: true },
  { id: 'mc11', name: '\u82f9\u679c\u7eff', nameEn: 'Apple Green', hex: '#68BD45', rgb: [0x68, 0xbd, 0x45], brand: 'common', code: 'APL', isCommon: true },
  { id: 'mc12', name: '\u6df1\u7eff', nameEn: 'Dark Green', hex: '#005C35', rgb: [0x00, 0x5c, 0x35], brand: 'common', code: 'DGN', isCommon: true },
  // Oranges
  { id: 'mc13', name: '\u9c9c\u6a59', nameEn: 'Orange', hex: '#ED6120', rgb: [0xed, 0x61, 0x20], brand: 'common', code: 'ORG', isCommon: true },
  { id: 'mc14', name: '\u6df1\u6a59', nameEn: 'Dark Orange', hex: '#D14A20', rgb: [0xd1, 0x4a, 0x20], brand: 'common', code: 'DOR', isCommon: true },
  // Purples
  { id: 'mc15', name: '\u7d2b\u8272', nameEn: 'Purple', hex: '#8C4EBE', rgb: [0x8c, 0x4e, 0xbe], brand: 'common', code: 'PUR', isCommon: true },
  { id: 'mc16', name: '\u6df1\u7d2b', nameEn: 'Dark Purple', hex: '#4A0E4E', rgb: [0x4a, 0x0e, 0x4e], brand: 'common', code: 'DPU', isCommon: true },
  { id: 'mc17', name: '\u84d1\u84d1\u7d2b', nameEn: 'Lavender', hex: '#AFA4D4', rgb: [0xaf, 0xa4, 0xd4], brand: 'common', code: 'LAV', isCommon: true },
  // Pinks
  { id: 'mc18', name: '\u5c11\u5973\u7c89', nameEn: 'Pink', hex: '#E44892', rgb: [0xe4, 0x48, 0x92], brand: 'common', code: 'PNK', isCommon: true },
  { id: 'mc19', name: '\u6d45\u7c89', nameEn: 'Light Pink', hex: '#F5AEC9', rgb: [0xf5, 0xae, 0xc9], brand: 'common', code: 'LPK', isCommon: true },
  { id: 'mc20', name: '\u6843\u7ea2', nameEn: 'Peach', hex: '#F0908D', rgb: [0xf0, 0x90, 0x8d], brand: 'common', code: 'PCH', isCommon: true },
  // Skin tones
  { id: 'mc21', name: '\u80a4\u8272', nameEn: 'Skin Tone', hex: '#E8B89D', rgb: [0xe8, 0xb8, 0x9d], brand: 'common', code: 'SKN', isCommon: true },
  { id: 'mc22', name: '\u5c0f\u9ea6\u8272', nameEn: 'Wheat', hex: '#D4A574', rgb: [0xd4, 0xa5, 0x74], brand: 'common', code: 'WHT2', isCommon: true },
  { id: 'mc23', name: '\u53e4\u94dc\u8272', nameEn: 'Bronze', hex: '#C68E5F', rgb: [0xc6, 0x8e, 0x5f], brand: 'common', code: 'BRZ', isCommon: true },
  // Browns
  { id: 'mc24', name: '\u5496\u55b1', nameEn: 'Brown', hex: '#5A3A29', rgb: [0x5a, 0x3a, 0x29], brand: 'common', code: 'BRN', isCommon: true },
  { id: 'mc25', name: '\u6df1\u68d5', nameEn: 'Dark Brown', hex: '#3E2723', rgb: [0x3e, 0x27, 0x23], brand: 'common', code: 'DBR', isCommon: true },
  { id: 'mc26', name: '\u6a61\u76ae\u68d5', nameEn: 'Chestnut', hex: '#8B6D5C', rgb: [0x8b, 0x6d, 0x5c], brand: 'common', code: 'CHS', isCommon: true },
  { id: 'mc27', name: '\u6d45\u68d5', nameEn: 'Light Brown', hex: '#A08B7B', rgb: [0xa0, 0x8b, 0x7b], brand: 'common', code: 'LBR', isCommon: true },
  // Greys
  { id: 'mc28', name: '\u6d45\u7070', nameEn: 'Light Gray', hex: '#C9CACA', rgb: [0xc9, 0xca, 0xca], brand: 'common', code: 'LGY', isCommon: true },
  { id: 'mc29', name: '\u4e2d\u7070', nameEn: 'Gray', hex: '#8A8D91', rgb: [0x8a, 0x8d, 0x91], brand: 'common', code: 'GRY', isCommon: true },
  { id: 'mc30', name: '\u6df1\u7070', nameEn: 'Dark Gray', hex: '#4F5052', rgb: [0x4f, 0x50, 0x52], brand: 'common', code: 'DGY', isCommon: true },
  // Additional frequently used
  { id: 'mc31', name: '\u4e73\u767d', nameEn: 'Cream', hex: '#FAE3C4', rgb: [0xfa, 0xe3, 0xc4], brand: 'common', code: 'CRM', isCommon: true },
  { id: 'mc32', name: '\u6a59\u9ec4', nameEn: 'Amber', hex: '#F7B500', rgb: [0xf7, 0xb5, 0x00], brand: 'common', code: 'AMB', isCommon: true },
  { id: 'mc33', name: '\u871c\u6843\u7ea2', nameEn: 'Coral', hex: '#F15A4A', rgb: [0xf1, 0x5a, 0x4a], brand: 'common', code: 'CRL', isCommon: true },
  { id: 'mc34', name: '\u9152\u7ea2', nameEn: 'Wine', hex: '#6B2737', rgb: [0x6b, 0x27, 0x37], brand: 'common', code: 'WNE', isCommon: true },
  { id: 'mc35', name: '\u6a59\u7c89', nameEn: 'Salmon', hex: '#F89883', rgb: [0xf8, 0x98, 0x83], brand: 'common', code: 'SLM', isCommon: true },
  { id: 'mc36', name: '\u8584\u8377\u7eff', nameEn: 'Mint', hex: '#82C5BE', rgb: [0x82, 0xc5, 0xbe], brand: 'common', code: 'MNT', isCommon: true },
  { id: 'mc37', name: '\u6e56\u84dd', nameEn: 'Lake Blue', hex: '#4C6CB5', rgb: [0x4c, 0x6c, 0xb5], brand: 'common', code: 'LBU', isCommon: true },
  { id: 'mc38', name: '\u5b9d\u84dd', nameEn: 'Royal Blue', hex: '#1E3A6E', rgb: [0x1e, 0x3a, 0x6e], brand: 'common', code: 'RBL', isCommon: true },
  { id: 'mc39', name: '\u94c1\u7070', nameEn: 'Iron Gray', hex: '#6B6D72', rgb: [0x6b, 0x6d, 0x72], brand: 'common', code: 'IGY', isCommon: true },
  { id: 'mc40', name: '\u94f6\u767d', nameEn: 'Silver', hex: '#B8BCC0', rgb: [0xb8, 0xbc, 0xc0], brand: 'common', code: 'SLV', isCommon: true },
];

// Full database by brand
export const BEAD_DATABASE: Record<string, BeadColor[]> = {
  mard: MARD_COLORS,
  perler: PERLER_COLORS,
  hama: HAMA_COLORS,
  artkal: ARTKAL_COLORS,
};

/**
 * Get colors for a specific brand
 */
export function getBrandColors(brandId: string): BeadColor[] {
  return BEAD_DATABASE[brandId] || MARD_COLORS;
}

/**
 * Get common colors
 */
export function getCommonColors(): BeadColor[] {
  return COMMON_COLORS;
}

/**
 * Find a color by brand and code
 */
export function findColorByCode(brandId: string, code: string): BeadColor | undefined {
  return BEAD_DATABASE[brandId]?.find((c) => c.code === code);
}
