/* globals assert, require */
"use strict";
const createMetadataParser = require("inject!addon/MetadataParser");
const TEST_TITLE = "Test Page";
const TEST_ICON = "https://www.foo.com/icon.png";
const TEST_IMAGE = "https://www.foo.com/image.png";
const TEST_DESCRIPTION = "This is a description";
const TEST_HTML = `<html>
  <head>
    <title>${TEST_TITLE}</title>
    <link rel="shortcut icon" type="image/x-icon" href="${TEST_ICON}" />
    <meta property="og:description" content="${TEST_DESCRIPTION}" />
    <meta property="og:image" content="${TEST_IMAGE}" />
  </head>
 </html>`;

describe("MetadataParser", () => {
  const {MetadataParser} = createMetadataParser({
    "common/vendor.bundle": {url: {resolve(url) {return url;}}},
    "chrome": {
      Cc: {"@mozilla.org/xmlextras/domparser;1": {createInstance: () => new DOMParser()}},
      Ci: {nsIDOMParser: {}}
    }
  });
  const metadataParser = new MetadataParser();

  it("should get the document object", () => {
    const result = metadataParser._getDocumentObject(TEST_HTML);
    assert.ok(result);
    assert.equal(result.querySelector("title").textContent, "Test Page");
  });

  it("should format the data properly", () => {
    const originalUrl = "https://www.foo.com";
    const incomingData = {
      "description": "Some description",
      "icon_url": "//www.foo.com/icon.png",
      "image_url": "//www.foo.com/image.png",
      "title": "Some title",
      "url": "https:///"
    };
    const expectedFormattedData = {
      "url": originalUrl,
      "images": [{"url": incomingData.image_url, "height": 500, "width": 500}],
      "title": incomingData.title,
      "description": incomingData.description,
      "favicon_url": incomingData.icon_url
    };
    // format the data so the MetadataStore can store it properly
    const formattedData = metadataParser._formatData(incomingData, originalUrl);

    assert.equal(formattedData.url, expectedFormattedData.url);
    assert.deepEqual(formattedData.images, expectedFormattedData.images);
    assert.equal(formattedData.title, expectedFormattedData.title);
    assert.equal(formattedData.description, expectedFormattedData.description);
    assert.equal(formattedData.favicon_url, expectedFormattedData.favicon_url);
  });

  it("should parse HTML text", () => {
    const url = "https://foo.com";
    const expectedResult = {
      url,
      "images": [{"url": TEST_IMAGE, "height": 500, "width": 500}],
      "title": TEST_TITLE,
      "favicon_url": TEST_ICON,
      "description": TEST_DESCRIPTION
    };
    return metadataParser.parseHTMLText(TEST_HTML, url).then(result => {
      assert.ok(result);
      assert.equal(result.url, expectedResult.url);
      assert.equal(result.title, expectedResult.title);
      assert.equal(result.description, expectedResult.description);
      assert.deepEqual(result.images, expectedResult.images);
      assert.equal(result.favicon_url, TEST_ICON);
    });
  });
});
