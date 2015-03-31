/// <reference path="../ModuleDefinition.ts" />

module ModuleDefinition {

    export class PopupGiveaway implements SteamGiftsModule {

        style = ".SGPP__popup_giveaway {text-align: justify; width: 90%; max-width: 1000px; display: none}\n" +
            ".SGPP__popup_giveaway .page__outer-wrap {padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right:20px}\n" +
            ".SGPP__popup_giveaway .comment__parent {margin-top: 10px}\n" +
            ".SGPP__popup_giveaway .global__image-outer-wrap--avatar-small {margin-right: 5px}\n" +
            ".SGPP__popup_giveaway .page__description {max-height: 200px; overflow-y: auto}\n" +
            ".SGPP__popup_giveaway .markdown li {position:relative}\n" +
            ".SGPP__popup_giveaway .featured__outer-wrap form > * {background-color: #f0f2f5}\n" +
            ".SGPP__popup_giveaway .featured__outer-wrap form {margin-top: 5px}\n";

        private popupGiveaway = $('<div>', {'class': 'SGPP__popup_giveaway'});
        private isPageEntered = SGPP.location.subpage == 'entered';

        init(): void {
            this.popupGiveaway.appendTo('body');
        }

        render(): void {
            $('.page__inner-wrap').on('click', 'a[href^="/giveaway/"]', (e) => {
                var $target = $(e.currentTarget);
                if (!e.ctrlKey && $target.attr('href').split('/').length == 4) {
                    e.preventDefault();
                    this.popupHandler($target)
                }
            })
        }

        private popupHandler = (target: JQuery) => {
            var gaUrl: string, tContainer: JQuery;

            gaUrl = target.attr('href');
            tContainer = target.closest('.giveaway__row-inner-wrap, .SGPP__gridTile, .table__row-inner-wrap')
            this.popupGiveaway.bPopup({
                onOpen: () => {
                    $.ajax({
                        url: gaUrl,
                        type: 'GET',
                        success: (page) => {this.ajaxSuccess($(page), gaUrl, tContainer)}
                    })
                },
                onClose: () => {
                    this.popupGiveaway.hide().empty();
                },
                follow: [true, false]
            })
        }

        private ajaxSuccess = (page: JQuery, gaUrl: string, tContainer: JQuery) => {
            var heading: JQuery,
                featured: JQuery,
                pageContainer: JQuery,
                description: JQuery,
                commentArea: JQuery,
                commentButton: JQuery;

            pageContainer = $('<div>', { 'class': 'page__outer-wrap' });

            heading = page.find('.page__heading').first();
            if (heading.text().trim() == 'Error') {
                pageContainer.append(heading.parent().removeClass('page__inner-wrap--narrow'));
                this.popupGiveaway.append(pageContainer);
                return
            }

            featured = page.find('.featured__outer-wrap');
            // remove text on icons
            $('.featured__column--whitelist, .featured__column--group', featured).each(function () {
                this.childNodes[1].nodeValue = '';
            });

            commentArea = page.find('.comment--submit .comment__parent');
            commentArea.find('span').addClass('b-close');

            commentButton = $('.js__submit-form', commentArea);

            featured.find('.featured__summary').append(page.find('.sidebar form, .sidebar__error'));

            description = page.find('.page__description');
            if (description.length > 0)
                pageContainer.append(heading, description);

            heading = heading.clone();
            heading.children().text('Comment');
            pageContainer.append(heading, commentArea);

            this.popupGiveaway.append(featured, pageContainer);

            this.popupGiveaway.css({
                'top': Math.max(0,(($(window).height() - (/* featured height*/208 + pageContainer.outerHeight())) / 2) + $(window).scrollTop())
            });


            $(".sidebar__entry-insert, .sidebar__entry-delete", featured).click((e) => {
                var t = $(e.currentTarget),
                    form = t.closest("form");

                t.addClass("is-hidden"),
                form.find(".sidebar__entry-loading").removeClass("is-hidden"),
                form.find("input[name=do]").val(t.attr("data-do")),
                $.ajax({
                    url: '/ajax.php',
                    type: "POST",
                    dataType: "json",
                    data: form.serialize(),
                    success: (e) => {
                        var isEntryInsert = t.hasClass("sidebar__entry-insert");

                        form.find(".sidebar__entry-loading").addClass("is-hidden");
                        if (e.type === "success") {
                            if (isEntryInsert)
                                form.find(".sidebar__entry-delete").removeClass("is-hidden");
                            else
                                form.find(".sidebar__entry-insert").removeClass("is-hidden");
                            this.fadeContainer(tContainer, isEntryInsert);
                        } else if (e.type === "error") {
                            if ("undefined" != typeof e.link && e.link !== false) {
                                form.html('<a href="' + e.link + '" class="sidebar__error"><i class="fa fa-exclamation-circle"></i> ' + e.msg + "</a>")
                            } else {
                                form.html('<div class="sidebar__error is-disabled"><i class="fa fa-exclamation-circle"></i> ' + e.msg + "</div>");
                            }
                        }

                        if ("undefined" != typeof e.entry_count && e.entry_count !== false) {
                            $(".live__entry-count").text(e.entry_count);
                            $(".nav__points").text(e.points);
                        }
                    }
                });
            });


            commentButton.on("click", (e) => {
                var submitButton = $(e.currentTarget);
                $.ajax({
                    url: gaUrl,
                    type: 'POST',
                    dataType: "json",
                    data: submitButton.closest("form").serialize(),
                    success: (page) => {
                        var comment = $('.fa-share', page).closest('.comment__parent');
                        if (comment.length > 0) {
                            submitButton.closest("form").find("textarea").val("");
                        }
                    },
                    complete: function() {
                        submitButton.removeClass('is-faded is-disabled')
                    }
                })
            });
        }

        private fadeContainer(ga: JQuery, entered: boolean=true) {
            if (this.isPageEntered) {
                ga.toggleClass('is-faded', !entered);
                ga.find('.table__remove-default').toggleClass('is-hidden', !entered);
                ga.find('.table__remove-complete').toggleClass('is-hidden', entered);
            } else {
                ga.toggleClass('is-faded', entered);
            }

        }

        name(): string {
            return "Popup Giveaway";
        }

        shouldRun = (location: SGLocation) =>  ['giveaways', 'user'].indexOf(location.pageKind) > -1;
    }

}
