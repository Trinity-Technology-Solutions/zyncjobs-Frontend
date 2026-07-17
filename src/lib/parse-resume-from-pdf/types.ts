export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  bold?: boolean;
}

export type TextItems = TextItem[];
