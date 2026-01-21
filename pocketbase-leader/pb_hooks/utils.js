module.exports = {
  hello: (name) => {
    console.log("Hello " + name);
  },
  dirExists: (dirName) => {
    try {
      $os.stat(dirName);

      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Directory doesn't exist, create it
      return { success: false };
    }
  },
};
