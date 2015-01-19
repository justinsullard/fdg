/*

Custom sring-based templating for Knockout.
Allows us to require our templates as text/strings in our config

*/
/*jslint browser:true*/
/*global require, define */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();
    function Template(template) {
        this.templateName = template;
        this.templateSrc = false;
    }
    Template.prototype.data = function (key, value) {
        var ret;
        this.templates.priv_data = this.templates.priv_data || {};
        this.templates.priv_data[this.templateName] = this.templates.priv_data[this.templateName] || {};
        if (arguments.length === 1) {
            ret = this.templates.priv_data[this.templateName][key];
        } else {
            this.templates.priv_data[this.templateName][key] = value;
        }
        return ret;
    };
    Template.prototype.text = function () {
        var ret = true;
        if (arguments.length === 0) {
            if (!this.templateSrc) {
                ret = FDG.config("templates." + this.templateName) || "";
            } else {
                ret = this.templateSrc;
            }
        } else {
            ret = false;
        }
        return ret;
    };
    function getStringEngine() {
        var engine = new FDG.ko.nativeTemplateEngine();
        engine.renderTemplate = function (template, bindingContext) {
            var templateSource = this.makeTemplateSource(template);
            return this.renderTemplateSource(templateSource, bindingContext);
        };
        engine.makeTemplateSource = function (template) {
            return new Template(template);
        };
        FDG.ko.setTemplateEngine(engine);
    }
    getStringEngine();
});
