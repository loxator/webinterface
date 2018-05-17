import Encryption from "utils/encryption";
import _ from "lodash";

import Iota from "../services/iota";

const CHUNK_SIZE = 1024;
const fileSizeFromNumChunks = numChunks => numChunks * CHUNK_SIZE;

const initializeUpload = file => {
  const handle = createHandle(file.name);
  return fileToChunks(file, handle, { withMeta: true }).then(chunks => {
    const fileName = file.name;
    const numberOfChunks = chunks.length;
    return { handle, fileName, numberOfChunks, chunks };
  });
};

const metaDataFromIotaFormat = (trytes, handle) => {
  const handleInBytes = Encryption.bytesFromHandle(handle);

  const stopperRemoved = Iota.removeStopperTryteAndPadding(trytes);
  const encryptedData = Iota.utils.fromTrytes(
    Iota.addPaddingIfOdd(stopperRemoved)
  );

  const decryptedData = Encryption.decryptChunk(handleInBytes, encryptedData);

  return JSON.parse(decryptedData);
};

const createHandle = fileName => {
  const fileNameTrimmed = Encryption.parseEightCharsOfFilename(fileName);
  const salt = Encryption.getSalt(8);
  const primordialHash = Encryption.getPrimordialHash();
  const handle = fileNameTrimmed + primordialHash + salt;

  return handle;
};

const readBlob = blob =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = ({ target }) => resolve(target.result);
      //reader.readAsBinaryString(blob);
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      reject(err);
    }
  });

const readBlobForTests = blob =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = ({ target }) => resolve(target.result);
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      reject(err);
    }
  });

const createMetaData = (fileName, numberOfChunks) => {
  const fileExtension = fileName.split(".").pop();

  const meta = {
    fileName: fileName.substr(0, 500),
    ext: fileExtension,
    numberOfChunks
  };

  return JSON.stringify(meta);
};

// Pipeline: file |> splitToChunks |> encrypt |> toTrytes
const fileToChunks = (file, handle, opts = {}) =>
  new Promise((resolve, reject) => {
    try {
      // Split into chunks.
      const chunksCount = Math.ceil(file.size / CHUNK_SIZE, CHUNK_SIZE);
      const chunks = [];
      const handleInBytes = Encryption.bytesFromHandle(handle);

      let fileOffset = 0;
      for (let i = 0; i < chunksCount; i++) {
        chunks.push(file.slice(fileOffset, fileOffset + CHUNK_SIZE));
        fileOffset += CHUNK_SIZE;
      }

      Promise.all(chunks.map(readBlob)).then(chunks => {
        let encryptedChunks = chunks
          .map(binaryString =>
            Encryption.encryptChunk(handleInBytes, binaryString)
          )
          .map(Iota.utils.toTrytes)
          .map(Iota.addStopperTryte)
          .map((data, idx) => ({ idx: idx + 1, data })); // idx because things will get jumbled

        if (opts.withMeta) {
          const metaChunk = createMetaData(file.name, chunksCount);
          const encryptedMeta = Encryption.encryptChunk(
            handleInBytes,
            metaChunk
          );
          const trytedMetaData = Iota.addStopperTryte(
            Iota.utils.toTrytes(encryptedMeta)
          );

          encryptedChunks = [
            { idx: 0, data: trytedMetaData },
            ...encryptedChunks
          ];
        }
        resolve(encryptedChunks);
      });
    } catch (err) {
      reject(err);
    }
  });

// Pipeline: chunks |> fromTrytes |> decrypt |> combineChunks
const chunksToFile = (chunks, handle) =>
  new Promise((resolve, reject) => {
    try {
      // ASC order.
      // NOTE: Cannot use `>` because JS treats 0 as null and doesn't work.
      chunks.sort((x, y) => x.idx - y.idx);
      const handleInBytes = Encryption.bytesFromHandle(handle);

      const bytes = chunks
        .map(({ data }) => data)
        .map(Iota.removeStopperTryteAndPadding)
        .map(Iota.addPaddingIfOdd)
        .map(Iota.utils.fromTrytes)
        .map(data => Encryption.decryptChunk(handleInBytes, data))
        .join(""); // join removes nulls

      resolve(new Blob([new Uint8Array(string2Bin(bytes))]));
    } catch (err) {
      reject(err);
    }
  });

const string2Bin = str => _.map(str, c => c.charCodeAt(0));

export default {
  metaDataFromIotaFormat,
  initializeUpload,
  readBlob,
  readBlobForTests,
  fileSizeFromNumChunks,
  fileToChunks, // used just for testing.
  chunksToFile
};
