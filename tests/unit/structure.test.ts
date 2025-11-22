import fs from 'fs';
import path from 'path';

describe('Source Directory Structure', () => {
  const srcDir = path.join(__dirname, '..', '..', 'src');
  const requiredDirs = [
    'config',
    'controllers',
    'services',
    'models',
    'jobs',
    'middleware',
    'routes',
    'utils',
    'types',
  ];
  // const requiredFiles = ['index.ts']; // Reserved for future use

  it('should have src/ directory', () => {
    expect(fs.existsSync(srcDir)).toBe(true);
    expect(fs.statSync(srcDir).isDirectory()).toBe(true);
  });

  it('should have src/index.ts file', () => {
    const indexPath = path.join(srcDir, 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.statSync(indexPath).isFile()).toBe(true);
  });

  describe('Required directories', () => {
    requiredDirs.forEach((dir) => {
      it(`should have src/${dir}/ directory`, () => {
        const dirPath = path.join(srcDir, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.statSync(dirPath).isDirectory()).toBe(true);
      });
    });
  });
});
