//@ts-check
/// <reference path="../JsExtensionTypes.d.ts" />
/**
 * VoxForge: расширение «Python». Действие выполняет Python-код прямо в игре
 * (через Pyodide). В коде доступны scene, game и objects("Имя").
 */

/** @type {ExtensionModule} */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        'Python',
        _('Python'),
        _('Run Python code in your game.'),
        'Quorvox',
        'Open source (MIT License)'
      )
      .setShortDescription(
        _('Write game logic in Python. Needs an internet connection.')
      )
      .setCategory('Advanced');
    extension
      .addInstructionOrExpressionGroupMetadata(_('Python'))
      .setIcon('JsPlatform/Extensions/take_screenshot32.png');

    extension
      .addAction(
        'RunPython',
        _('Run Python code'),
        _(
          'Run Python code. Available: scene, game and objects("Name"). Write line breaks as \\n.'
        ),
        _('Run Python: _PARAM1_'),
        '',
        'JsPlatform/Extensions/take_screenshot32.png',
        'JsPlatform/Extensions/take_screenshot32.png'
      )
      .addCodeOnlyParameter('currentScene', '')
      .addParameter('string', _('Python code'), '', false)
      .getCodeExtraInformation()
      .setFunctionName('gdjs.python.run');

    extension
      .addAction(
        'PreloadPython',
        _('Load Python in advance'),
        _('Start loading Python now, so scripts run without a delay later.'),
        _('Load Python in advance'),
        '',
        'JsPlatform/Extensions/take_screenshot32.png',
        'JsPlatform/Extensions/take_screenshot32.png'
      )
      .getCodeExtraInformation()
      .setFunctionName('gdjs.python.preload');

    return extension;
  },
  runExtensionSanityTests: function (gd, extension) {
    return [];
  },
};
