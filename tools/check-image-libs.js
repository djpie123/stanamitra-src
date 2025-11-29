(async function () {
  async function check(name) {
    try {
      const mod = await import(name);
      console.log(`${name} available`);
      return true;
    } catch (err) {
      console.log(`${name} NOT available`);
      return false;
    }
  }

  await check('sharp');
  await check('jimp');
})();
