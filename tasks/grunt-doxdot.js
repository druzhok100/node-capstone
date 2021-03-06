var grunt;

module.exports = function (g) {
    grunt = g;
    grunt.registerTask("doxdot", "Build docs using dox and doT", task);
};

function task() {
    var path    = require("path");
    var dot     = require("dot");
    var proc    = require("./doxdot/processors")

    var ctx     = new proc.DocContext();
    ctx.options = this.options();

    // Get package info
    ctx.pkg = grunt.config("pkg");

    // Get destination directory
    var dest = grunt.config("doxdot.dest");
    if (dest.slice(-1) !== path.sep) {
        dest += path.sep;
    }

    // Get the views directory
    var views = ctx.options.views || "views";
    if (views.slice(-1) !== path.sep) {
        views += path.sep;
    }

    // Render README, if any
    if ("readme" in ctx.options) {
        ctx.processReadme(grunt.file.read(ctx.options.readme));
    }

    // Process all source files
    grunt.config("doxdot.src").forEach(function (file) {
        ctx.addSource(grunt.file.read(file));
    });
    ctx.processSource();

    // Process all templates with doT
    var dots = dot.process({
        "path"              : views,
        "destination"       : dest,
        "templateSettings"  : {
            "varname"           : "ctx",
        },
    });

    // Render templates and write to disk
    grunt.file.write(dest + "index.html", dots.index(ctx));

    [ "constants", "functions", "misc" ].forEach(function (template) {
        if (Object.keys(ctx[template]).length) {
            grunt.file.write(dest + template + ".html", dots[template](ctx));
        }
    });

    var classNames = Object.keys(ctx.classes).concat(Object.keys(ctx.modules));
    if (classNames.length) {
        classNames.forEach(function (className) {
            ctx.className = className;
            grunt.file.write(dest + className + ".html", dots.classes(ctx));
        });
    }

    // Copy any view subdirectories
    console.log("Copying additional view files...");
    grunt.file.expand(views + "*/**").forEach(function (source) {
        if (grunt.file.isFile(source)) {
            var target = source.replace(new RegExp("^" + views), dest);
            grunt.file.copy(source, target);
        }
    });
}
