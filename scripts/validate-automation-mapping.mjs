import { validateAutomationTree } from './automation-mapping.mjs';

const result = await validateAutomationTree('tests');
console.log(
  `Validated ${result.testcases} testcase mapping(s) across ${result.specs} spec file(s).`,
);
