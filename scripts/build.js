const fs = require('fs-extra');
const rm = require('rimraf');
const zip = require('cross-zip');
const path = require('path');
const walk = require('klaw-sync');
const minifyJS = require('terser').minify;
const minifyHTML = require('html-minifier').minify;
const webext = require('web-ext');

const NAME = require('../package.json').name;
const VERSION = require('../package.json').version;

const BUILD_DIR = path.resolve(__dirname, `./${NAME}-${VERSION}`);
const SRC_AMO_DIR = `${BUILD_DIR}-src`;

function copy(sources, destination) {
	for (const source of sources) {
		const srcpath = path.resolve(__dirname, source);
		const target = path.join(destination, path.parse(srcpath).base);

		if (fs.lstatSync(srcpath).isDirectory()) {
			fs.ensureDirSync(target);
		}

		fs.copySync(srcpath, target);
	}
}

(async () => {
	// Remove potential artifacts from previous builds
	rm.sync('*.zip');

	// Create a folder to package the web extension
	fs.emptyDirSync(BUILD_DIR);

	// Copy the source and assets
	console.log('Copying source & assets...');
	copy(['../src', '../src/icon', '../src/manifest.json'], BUILD_DIR);

	// Remove the '--dev' suffix in the extension ID
	fs.writeFileSync(
		path.join(BUILD_DIR, 'manifest.json'),
		fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8').replace('--dev', ''),
	);

	// Create a zipped copy of the unminified source with some meta files for AMO
	console.log('Creating zipped source dir for AMO...');
	fs.ensureDirSync(SRC_AMO_DIR);
	fs.copySync(BUILD_DIR, SRC_AMO_DIR);
	copy(['../package.json', '../LICENSE', '../README.md'], SRC_AMO_DIR);
	zip.zipSync(SRC_AMO_DIR, `${SRC_AMO_DIR}.zip`);

	// Minify all the HTML and JS files in the build dir
	await Promise.all(walk(BUILD_DIR).map(async file => {
		switch (path.parse(file.path).ext) {
			case '.js': {
				const { code: minifiedCode } = await minifyJS(fs.readFileSync(file.path, 'utf8'));
				fs.writeFileSync(file.path, minifiedCode);
				break;
			}

			case '.html':
				fs.writeFileSync(file.path, minifyHTML(fs.readFileSync(file.path, 'utf8'), {
					decodeEntities: true,
					collapseWhitespace: true,
					conservativeCollapse: true,
					collapseBooleanAttributes: true,
					collapseInlineTagWhitespace: true,
				}));
				break;

			default:
				break;
		}
	}));

	// Package the extension using web-ext
	console.log('Packaging extension using web-ext...');
	await webext.cmd.build({
		noInput: true,
		sourceDir: BUILD_DIR,
		artifactsDir: __dirname,
		overwriteDest: true,
	}, {
		shouldExitProgram: false,
	});

	// Clean up
	fs.removeSync(BUILD_DIR);
	fs.removeSync(SRC_AMO_DIR);
})();
