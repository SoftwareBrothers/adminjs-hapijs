/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { promises: fs } = require('fs');
const pkg = require('../package.json');

const cmd = util.promisify(exec);

const infoContents = `export default {
  name: '${pkg.name}',
  version: '${pkg.version}',
};
`;

const infoFilePath = path.join(process.cwd(), 'src/info.ts');

(async () => {
  await fs.writeFile(infoFilePath, infoContents);
  await cmd('npx tsc -p info.tsconfig.json');
})();
