//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2014 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

/*global exec */
/*global test */
/*global env  */
/*global find */

require('shelljs/global');
var path = require('path'),
    _    = require('lodash');

var PLUGIN_INFO_CMD_PATH = path.join(__dirname, '..', 'bin', 'plugin_info');

function runPluginsInfo() {
  var fullCmd = exec(PLUGIN_INFO_CMD_PATH, { silent: true });
  return fullCmd.code === 0 ? fullCmd.output : '{}';
}

var OpenProjectPlugins = {
  allPluginNamesPaths: _.memoize(function() {
    return JSON.parse(runPluginsInfo());
  }),

  pluginNamesPaths: function() {
    return _.reduce(this.allPluginNamesPaths(), function(obj, pluginPath, pluginName) {
      if (test('-e', path.join(pluginPath, 'package.json'))) {
        obj[pluginName] = pluginPath;
      } else {
        console.info('INFO: plugin "%s" does not provide a package.json', pluginName);
      }
      return obj;
    }, {});
  },

  findPluginPath: _.memoize(function(name) {
    return this.pluginNamesPaths()[name];
  }, _.identity),

  pluginDirectories: function() {
    return _.reduce(this.allPluginNamesPaths(), function(dirList, pluginPath) {
      var pluginDir = path.dirname(pluginPath);
      return dirList.indexOf(pluginDir) === -1 ? dirList.concat(pluginDir) : dirList;
    }, []);
  }
};

var TranslationsPlugin = {
  envPath: function() {
    if (env['OPENPROJECT_TRANSLATIONS_ROOT']) {
      return path.resolve(__dirname, '..', env['OPENPROJECT_TRANSLATIONS_ROOT']);
    }
  },

  findPluginPath: function() {
    return this.envPath() || OpenProjectPlugins.findPluginPath('openproject-translations') || '';
  },

  findLocaleFiles: function() {
    var localeFilePath = path.join(this.findPluginPath(), 'config', 'locales');
    return find(localeFilePath).filter(function(file) {
      return file.match(/js-([\w|-]){2,5}\.yml$/);
    });
  }
};

exports.pluginNamesPaths          = OpenProjectPlugins.pluginNamesPaths();
exports.pluginDirectories         = OpenProjectPlugins.pluginDirectories();
exports.translationsPluginLocales = TranslationsPlugin.findLocaleFiles();
exports.translationsPluginPath    = TranslationsPlugin.findPluginPath();
