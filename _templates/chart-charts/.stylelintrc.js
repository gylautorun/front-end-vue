/*
 * @Description: 
 * @Version: 2.0
 * @Autor: GUOCHAO82
 * @Date: 2021-05-18 16:42:53
 * @LastEditors: GUOCHAO82
 * @LastEditTime: 2022-07-05 10:15:41
 */
module.exports = {
  root: true,
  customSyntax:'postcss-scss',
  "extends": ["stylelint-config-standard", "stylelint-config-rational-order"],
  "rules": {
    "at-rule-no-unknown": [true, {"ignoreAtRules" :[
      "mixin", "extend", "content", "include",'function','return', 'use','if','else'
    ]}],
    "indentation": 2,
    "no-descending-specificity": null, // 禁止特异性较低的选择器在特异性较高的选择器之后重写
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": [
          "/^deep/"
        ],
      }
    ],
    "font-family-no-missing-generic-family-keyword": null,
    "selector-class-pattern":null,
  },
  overrides: [
    {
      customSyntax: "postcss-html",
      files: ["*.vue", "**/*.vue", "*.html", "**/*.html"],
      extends: ["stylelint-config-recommended", "stylelint-config-html", "stylelint-config-recess-order"],
      rules: {
        "keyframes-name-pattern": null,
        "selector-pseudo-class-no-unknown": [
          true,
          {
            ignorePseudoClasses: ["deep", "global"]
          }
        ],
        "selector-pseudo-element-no-unknown": [
          true,
          {
            ignorePseudoElements: ["v-deep", "v-global", "v-slotted"]
          }
        ]
      }
    }
  ]
}