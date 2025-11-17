/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const colors = [
  'rgb(0, 0, 0)',
  'rgb(255, 255, 255)',
  'rgb(213, 40, 40)',
  'rgb(250, 123, 23)',
  'rgb(240, 186, 17)',
  'rgb(8, 161, 72)',
  'rgb(26, 115, 232)',
  'rgb(161, 66, 244)',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

export const segmentationColors = [
  '#E6194B',
  '#3C89D0',
  '#3CB44B',
  '#FFE119',
  '#911EB4',
  '#42D4F4',
  '#F58231',
  '#F032E6',
  '#BFEF45',
  '#469990',
];
export const segmentationColorsRgb = segmentationColors.map((c) => hexToRgb(c));

// FIX: Remove top-level await by exporting a function to fetch image options asynchronously.
const imageOptionFilenames = [
  'origami.jpg',
  'pumpkins.jpg',
  'clock.jpg',
  'socks.jpg',
  'breakfast.jpg',
  'cat.jpg',
  'spill.jpg',
  'fruit.jpg',
  'baklava.jpg',
];

export const fetchImageOptions = (): Promise<string[]> =>
  Promise.all(
    imageOptionFilenames.map(async (i) =>
      URL.createObjectURL(
        await (
          await fetch(
            `https://www.gstatic.com/aistudio/starter-apps/bounding-box/${i}`,
          )
        ).blob(),
      ),
    ),
  );

export const defaultPromptParts = {
  '2D bounding boxes': [
    'Détecter',
    "les fissures, l'écaillage et les taches d'eau sur la surface en béton",
    '',
  ],
  'Segmentation masks': [
    `Donner les masques de segmentation pour`,
    'toutes les zones de peinture écaillée sur les murs extérieurs',
    `. Sortir une liste JSON de masques de segmentation où chaque entrée contient la boîte englobante 2D dans la clé "box_2d", le masque de segmentation dans la clé "mask", et l'étiquette de texte dans la clé "label". Utiliser des étiquettes descriptives.`,
  ],
  Points: [
    'Pointer vers les',
    `emplacements des briques manquantes sur la façade`,
    ' avec un maximum de 10 éléments. La réponse doit suivre le format json : [{"point": <point>, "label": <label1>}, ...]. Les points sont au format [y, x] normalisé de 0 à 1000.',
  ],
};

export const defaultPrompts = {
  '2D bounding boxes': `Détecter tous les défauts de construction visibles. Pour chaque défaut, fournir une boîte englobante 2D et une étiquette descriptive. Exemples de défauts : fissures, écaillage, dégâts des eaux, corrosion et installations incorrectes. Sortir une liste JSON où chaque entrée contient la boîte englobante 2D dans "box_2d" et une étiquette de texte dans "label".`,
  'Segmentation masks': `Segmenter toutes les zones présentant des défauts de surface. Cela inclut la peinture écaillée, la moisissure, le mildiou ou la décoloration généralisée. Sortir une liste JSON de masques de segmentation où chaque entrée contient la boîte englobante 2D dans la clé "box_2d", le masque de segmentation dans la clé "mask", et l'étiquette de texte dans la clé "label". Utiliser des étiquettes descriptives.`,
  Points: `Repérer les défauts spécifiques et localisés. Il peut s'agir de fixations manquantes, de tuyaux qui fuient ou de carreaux ébréchés. La réponse doit suivre le format json : [{"point": <point>, "label": <label1>}, ...]. Les points sont au format [y, x] normalisé de 0 à 1000.`,
};

const safetyLevel = 'only_high';

export const safetySettings = new Map();

safetySettings.set('harassment', safetyLevel);
safetySettings.set('hate_speech', safetyLevel);
safetySettings.set('sexually_explicit', safetyLevel);
safetySettings.set('dangerous_content', safetyLevel);
safetySettings.set('civic_integrity', safetyLevel);
