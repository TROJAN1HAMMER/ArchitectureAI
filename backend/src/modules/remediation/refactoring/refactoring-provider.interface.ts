export interface ProposedFileRefactor {
  filePath: string;
  originalContent: string;
  proposedContent: string;
  diff: string;
  reason: string;
}

export interface IRefactoringProvider {
  generateRefactorProposals(
    findingType: string,
    evidence: any,
    targetFiles: Array<{ filePath: string; content: string }>,
  ): Promise<ProposedFileRefactor[]>;
}
