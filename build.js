
/**
 * warpgate/build.js
 */

const fs          = require('fs-extra');
const rm          = require('rimraf');
const path        = require('path');
const zip         = require('cross-zip');
const walk        = require('klaw-sync');
const terser      = require('terser');
const minifyHTML  = require('html-minifier').minify;
const webext      = require('web-ext').default

const NAME        = require('./package.json').name;
const VERSION     = require('./package.json').version;
const BUILD_DIR   = path.resolve(__dirname, `./${NAME}-${VERSION}`);
const SRC_AMO_DIR = `${BUILD_DIR}-src`;

// Remove potential artifacts from previous builds
rm.sync('*.zip');

// Create a folder to package the web extension
fs.emptyDirSync(BUILD_DIR);

// Copy the source and assets
console.info('Copying source & assets...');
copy(['./src', './icons', './manifest.json'], BUILD_DIR);

// Remove the '--dev' suffix in the extension ID
fs.writeFileSync(`${BUILD_DIR}/manifest.json`, fs.readFileSync(`${BUILD_DIR}/manifest.json`).toString().replace('--dev', ''));

// Create a zipped copy of the unminified source with some meta files for AMO
console.info('Creating zipped source dir for AMO...');
fs.ensureDirSync(SRC_AMO_DIR);
fs.copySync(BUILD_DIR, SRC_AMO_DIR);
copy(['./package.json', 'LICENSE', 'README.md'], SRC_AMO_DIR);
zip.zipSync(SRC_AMO_DIR, `${SRC_AMO_DIR}.zip`);

// Minify all the HTML and JS files in the build dir
walk(BUILD_DIR).forEach(function(file)
{
	switch (path.parse(file.path).ext)
	{
		case '.js':   fs.writeFileSync(file.path, terser.minify(fs.readFileSync(file.path).toString()).code);
		case '.html': fs.writeFileSync(file.path,    minifyHTML(fs.readFileSync(file.path).toString(), {
			decodeEntities:              true,
			collapseWhitespace:          true,
			collapseInlineTagWhitespace: true,
			collapseBooleanAttributes:   true,
		}));
	}
});

// Package the extension using web-ext
console.info('Packaging extension using web-ext...');
webext.cmd.build({
	noInput:           true,
	sourceDir:         BUILD_DIR,
	artifactsDir:      __dirname,
	overwriteDest:     true,
}, {    shouldExitProgram: false,
}).then(function()
{
	// Clean up
	fs.removeSync(BUILD_DIR);
	fs.removeSync(SRC_AMO_DIR);
});

function copy(sources, dest)
{
	(Array.isArray(sources) ? sources : [sources]).forEach(function(src)
	{
		const srcpath = path.resolve(__dirname, src);
		const target  = `${dest}/${path.parse(srcpath).base}`;

		if (fs.lstatSync(srcpath).isDirectory()) fs.ensureDirSync(target);
		fs.copySync(srcpath, target);
	});
}
