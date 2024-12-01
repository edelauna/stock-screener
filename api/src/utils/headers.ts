const ContentType = {
  JSON: "application/json",
};

type ContentTypeKeys = keyof typeof ContentType;

export const getContentType = (type: ContentTypeKeys) => {
  return {
      "content-type": ContentType[type],
  };
}