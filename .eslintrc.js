module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'consistent-return': 'off',
    'global-require': 'off',
    'import/prefer-default-export': 'off',
    'max-len': [
      2,
      {
        code: 120,
        tabWidth: 2,
        ignoreTrailingComments: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true,
      },
    ],
    'no-return-assign': 'off',
    'no-shadow': 'off',
    'no-underscore-dangle': 'off',
  },
};
