let gulp = require('gulp');


// Load modules

let sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    watch = require('gulp-watch'),
    eslint= require('gulp-eslint'),
    browserSync = require('browser-sync').create(),
    uglify = require('gulp-uglify-es').default,
    concat = require('gulp-concat');
    /*
    Modules to implement  
    htmlMini = require('gulp-minify-html'),
    cssMini = require('gulp-minfy-css');
    */

gulp.task('scripts', function(done){
    gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist/js'));
        done();
})

gulp.task('scripts-dist', function(done){
    gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js')); 
        done();   
})

gulp.task('copy-html', function(done){
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
        done();
});

gulp.task('copy-images', function(done){
    gulp.src('img/*')
        .pipe(gulp.dest('dist/img'));
    done();
})

gulp.task('styles',function(done){

        gulp.src('sass/**/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions']
            }))
            .pipe(gulp.dest('dist/css'))
            .pipe(browserSync.stream());
        done();

})

gulp.task('lint', function(done){
    return gulp.src(['js/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
    done();
})

gulp.task('default', 
    gulp.series('styles', 'lint', function(done){
        gulp.watch('sass/**/*.scss', gulp.series('styles'));
        gulp.watch('js/**/*.js', gulp.series('lint'));
    done();

    browserSync.init({
        server: './dist'
});


// place code for your default task here

}))