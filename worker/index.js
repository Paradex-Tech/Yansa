/* Byte-range support for the hero films.
   Static assets always answer with the whole file, but Safari only plays a
   <video> whose server honours Range requests (206 Partial Content). So
   /videos/* runs through here. The asset binding doesn't report the file's
   length, so the chunks are read first to learn the size, then only the
   requested bytes are sent back (as views onto those chunks, not copies). */

async function readChunks(body) {
  var reader = body.getReader();
  var chunks = [];
  var size = 0;
  for (;;) {
    var step = await reader.read();
    if (step.done) break;
    chunks.push(step.value);
    size += step.value.byteLength;
  }
  return { chunks: chunks, size: size };
}

// Parses "bytes=a-b", "bytes=a-" and "bytes=-n"; null when unusable
function parseRange(header, size) {
  var match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) return null;
  if (match[1] === '') {
    return { start: Math.max(0, size - Number(match[2])), end: size - 1 };
  }
  var start = Number(match[1]);
  var end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  return { start: start, end: end };
}

function sliceStream(chunks, start, end) {
  var i = 0;
  var pos = 0;
  return new ReadableStream({
    pull: function (controller) {
      while (i < chunks.length) {
        var chunk = chunks[i++];
        var from = pos;
        pos += chunk.byteLength;
        if (pos <= start) continue;
        controller.enqueue(chunk.subarray(Math.max(0, start - from), Math.min(chunk.byteLength, end + 1 - from)));
        if (pos > end) i = chunks.length;
        return;
      }
      controller.close();
    }
  });
}

export default {
  async fetch(request, env) {
    var asset = await env.ASSETS.fetch(request);
    var header = request.headers.get('Range');

    if (asset.status !== 200 || !header || request.method !== 'GET') {
      if (asset.status !== 200) return asset;
      var whole = new Response(asset.body, asset);
      whole.headers.set('Accept-Ranges', 'bytes');
      return whole;
    }

    var file = await readChunks(asset.body);
    var headers = new Headers(asset.headers);
    headers.set('Accept-Ranges', 'bytes');

    var range = parseRange(header, file.size);
    if (!range) {
      headers.set('Content-Length', String(file.size));
      return new Response(sliceStream(file.chunks, 0, file.size - 1), { status: 200, headers: headers });
    }
    if (range.start >= file.size || range.start > range.end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + file.size } });
    }

    headers.set('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.size);
    headers.set('Content-Length', String(range.end - range.start + 1));
    return new Response(sliceStream(file.chunks, range.start, range.end), { status: 206, headers: headers });
  }
};
