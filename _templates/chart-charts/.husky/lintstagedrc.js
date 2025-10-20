module.exports = {
  "*.{js,jsx,ts,tsx,vue}": ["eslint --fix"],
  "package.json": ["prettier --write"],
  "*.{vue,css,scss}": ["stylelint --fix"],
};
