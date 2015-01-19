/*jslint browser: true */
/*global define, require, exports, module */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();

    var priv = {
        "lastTitle": null,
        "lastViewModel": null
    };

    function onFDGStartSuccess() {
        FDG.util.logging.debug("module/dialogs started");
        return;
    }
    function closeModal() {
        if (FDG.$('.modalBackground').length > 0) {
            if (priv.lastViewModel) {
                FDG.ko.cleanNode(FDG.$('.modalContent').get(0));
            }
            FDG.$('.modalBackground').remove();
            priv.lastTitle = null;
            priv.lastViewModel = null;
        }
    }
    function showModal(message) {
        var dialog;
        if (FDG.$('.modalBackground').length === 0) {
            dialog = FDG.$(FDG.config("templates.dialogs.modal"));
            if (message.title) {
                priv.lastTitle = message.title;
            } else {
                priv.lastTitle = "Modal Dialog";
            }
            dialog.find(".modalTitle span").text(priv.lastTitle);
            dialog.find('.cancel_icon').click(closeModal);
            FDG.$('body').append(dialog);
            if (message.template) {
                FDG.$('.modalContent').append(FDG.config(message.template));
            }
            if (message.viewModel) {
                priv.lastViewModel = message.viewModel;
                if (!priv.lastViewModel.closeModal) {
                    priv.lastViewModel.closeModal = closeModal;
                }
                FDG.ko.applyBindings(priv.lastViewModel, FDG.$('.modalContent').get(0));
            }
        } else {
            FDG.util.logging.warn("Another modal dialog is already present, ignoring request to open another.");
        }
    }

    FDG.subscribe({"channel": "fdg-start-success", "callback": onFDGStartSuccess});
    FDG.subscribe({"channel": "fdg-show-modal", "callback": showModal});
    FDG.subscribe({"channel": "fdg-close-modal", "callback": closeModal});


});
