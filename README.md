# warpgate

**Warpgate** is  a browser extension which  enables a quick and  painless way to
access "external bookmarks", i.e.  URLs that have been pinned/starred/bookmarked
in a third-party service or web app.

> For now, Warpgate only works  with starred GitHub repos. Suggestions for other
> services are welcomed!

## Installation
@TODO

## Configuration
@TODO

## F.A.Q.

### What about things like saved  Reddit posts, Pocket items, tweet collections,
etc ?
Those URLs are more akin to archived files: they're saved for a potential use at
an  unknown later  point, not  for regular  visits. Warpgate  focuses on  giving
instant access  to more frequently visited  URLs which are closer  to in-browser
bookmarks.

### What are the required permissions for ?
The **storage** permission is  needed to keep the list of  URLs in the browser's
long-term memory  and avoid  flooding third-party  services with  requests every
time you enter something in the address bar.

The **notifications**  is needed  to, well, send  notifications. It's  only used
once, when  the local  data is forcefully  refreshed by pressing  `Alt +  W`, to
notify of the success of the operation.

## Changelog
See the full changelog [here](https://github.com/cheap-glitch/warpgate/releases).

## License
This software is distributed under the [GNU GPL v3.0](https://spdx.org/licenses/
GPL-3.0.html).
