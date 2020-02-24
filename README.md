<p align="center">
	<img src="https://raw.githubusercontent.com/cheap-glitch/warpgate/master/docs/banner.png" alt="banner">
</p>

<div align="center">
	<img src="https://badgen.net/github/license/cheap-glitch/warpgate" alt="license badge">
	<img src="https://badgen.net/github/release/cheap-glitch/warpgate" alt="latest release badge">
</div>

#### Table of contents
 * [Installation](#installation)
 * [Configuration](#configuration)
   * [Starred GitHub repos](#starred-github-repos)
 * [Usage](#usage)
 * [F.A.Q.](#faq)
 * [Changelog, Acknowledgements & License](#changelog)

**Warpgate** is  a browser extension which  enables a quick and  painless way to
access "external bookmarks", i.e.  URLs that have been pinned/starred/bookmarked
in a third-party service or web app.

> For now, Warpgate only works  with starred GitHub repos. Suggestions for other
> services are welcomed!

## Installation
@TODO

## Configuration
Go the preferences  page (`about:addons` > *Warpgate* >  *Preferences*) to setup
the extension.

#### Starred GitHub repos
Create a new personal token by going to [this page](https://github.com/settings/tokens/new?description=Warpgate&scopes=read:user)
and clicking  on **Generate token**  at the bottom. Copy-paste  the alphanumeric
code in the corresponding field, wait for  the targets to update, and that's it!

You can  now jump  to any  of your  starred GitHub  repos. The  suggestions will
update themselves when you unstar a repo or star a new one.

## Usage
Enter the  prefix `@` in  the address  bar, followed by  a space and  the search
string. Warpgate will suggest matching targets based on your settings.

The warp targets are  updated every 10 minutes, but if for  some reason you want
an immediate refresh, press `Alt + W` on your keyboard.

## F.A.Q.

### What about things like saved  Reddit posts, Pocket items, tweet collections, etc?
Those URLs are more akin to archived files: they're saved for a potential use at
an  unknown later  point, not  for regular  visits. Warpgate  focuses on  giving
instant access  to more frequently visited  URLs which are closer  to in-browser
bookmarks.

### What are the required permissions for?
The **storage** permission is  needed to keep the list of  URLs in the browser's
long-term memory  and avoid  flooding third-party  services with  requests every
time you enter something in the address bar.

The **notifications**  is needed  to, well, send  notifications. It's  only used
once, when  the local  data is forcefully  refreshed by pressing  `Alt +  W`, to
notify of the success of the operation.

## Changelog
See the full changelog [here](https://github.com/cheap-glitch/warpgate/releases).

## Acknowledgements
The font  used for the banner  is [VAL](https://www.fontfabric.com/fonts/val) by
[FontFabric](https://www.fontfabric.com).

## License
This software is distributed under the [GNU LGPL 3.0](https://spdx.org/licenses/LGPL-3.0-only.html).
