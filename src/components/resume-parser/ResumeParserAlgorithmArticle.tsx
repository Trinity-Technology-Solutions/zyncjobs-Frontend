import React from 'react';
import { Heading, Paragraph } from "../documentation";

export const ResumeParserAlgorithmArticle = ({
  textItems,
  lines,
  sections,
}: {
  textItems: any[];
  lines: any[];
  sections: any;
}) => {
  return (
    <article className="mt-10">
      <Heading className="text-primary !mt-0 border-t-2 pt-8">
        Resume Parser Algorithm
      </Heading>
      <Paragraph smallMarginTop={true}>
        This section shows how the resume parser processes your PDF file through multiple steps
        to extract structured information.
      </Paragraph>
      
      <Heading level={2}>Step 1: Extract Text Items</Heading>
      <Paragraph smallMarginTop={true}>
        The parser extracts {textItems.length} text items from your resume PDF.
      </Paragraph>
      
      <Heading level={2}>Step 2: Group into Lines</Heading>
      <Paragraph smallMarginTop={true}>
        Text items are grouped into {lines.length} readable lines.
      </Paragraph>
      
      <Heading level={2}>Step 3: Identify Sections</Heading>
      <Paragraph smallMarginTop={true}>
        Lines are organized into sections like Profile, Experience, Education, and Skills.
      </Paragraph>
      
      <Heading level={2}>Step 4: Extract Information</Heading>
      <Paragraph smallMarginTop={true}>
        The parser uses pattern matching to identify and extract specific resume attributes
        from each section.
      </Paragraph>
    </article>
  );
};