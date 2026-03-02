export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  bold?: boolean;
}

export type TextItems = TextItem[];