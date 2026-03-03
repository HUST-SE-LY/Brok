export function generateUuid() {
  const dev_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (name) {
      const randomInt = (16 * Math.random()) | 0;
      return ('x' === name ? randomInt : (3 & randomInt) | 8)
        .toString(16)
        .toUpperCase();
    },
  );
  return dev_id;
}
