export interface SubtitleSegment {
  id: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string; // Original text
  translation?: string; // Translated text
  pronunciation?: string; // Romanization/Phonetic
}

export const MOCK_SUBTITLES: SubtitleSegment[] = [
  {
    id: "sub-1",
    startTime: 1500,
    endTime: 4000,
    text: "The snow glows white on the mountain tonight",
    translation: "오늘 밤 산에 눈이 하얗게 빛나고",
    pronunciation: "Oneul bam san-e nun-i hayahge bitnago",
  },
  {
    id: "sub-2",
    startTime: 4200,
    endTime: 7000,
    text: "Not a footprint to be seen",
    translation: "발자국 하나 보이지 않아",
    pronunciation: "Baljaguk hana boiji ana",
  },
  {
    id: "sub-3",
    startTime: 7500,
    endTime: 10000,
    text: "A kingdom of isolation",
    translation: "고립의 왕국",
    pronunciation: "Gorip-ui wangguk",
  },
  {
    id: "sub-4",
    startTime: 10200,
    endTime: 12500,
    text: "And it looks like I'm the queen",
    translation: "그리고 내가 여왕인 것 같아",
    pronunciation: "Geurigo naega yeowang-in geot gata",
  },
];






