import actions from "./remove-actions";

test("removeFileByHandle", () => {
  const name = "n1";
  const handle = "h1";
  const masterHandle = "mh1";
  const expected = {
    type: actions.REMOVE_FILE_BY_HANDLE,
    payload: {
      name,
      handle,
      masterHandle
    }
  };
  expect(actions.removeFileByHandle({ name, handle, masterHandle })).toEqual(
    expected
  );
});

test("removeFileByName", () => {
  const name = "n1";
  const handle = "h1";
  const masterHandle = "mh1";
  const expected = {
    type: actions.REMOVE_FILE_BY_NAME,
    payload: {
      name,
      handle,
      masterHandle
    }
  };
  expect(actions.removeFileByName({ name, handle, masterHandle })).toEqual(
    expected
  );
});