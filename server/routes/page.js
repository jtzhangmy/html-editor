import koaRouter from 'koa-router';
import {
    pageGet,
    pageSave,
    pageBuild,
    pageOpen,
    pageDelete,
    pageRelease,
    pageDownload,
    iconSave,
    dirNameSave
} from '../controller/page'

const router = koaRouter();

// 设置url前缀
router.prefix('/api/page');

router.post('/get', pageGet);

router.post('/save', pageSave);

router.post('/build', pageBuild);

router.post('/open', pageOpen);

router.post('/delete', pageDelete);

router.post('/release', pageRelease);

router.post('/download', pageDownload);

router.post('/icon_save', iconSave);

router.post('/dirname_save', dirNameSave);

const test = async (ctx, next) => {
    console.log('-------------');
    console.log('ctx.header: ', ctx.header);
    console.log('ctx.headers: ', ctx.headers);
    console.log('ctx.method: ', ctx.method);
    console.log('ctx.url: ', ctx.url);
    console.log('ctx.originalUrl: ', ctx.originalUrl);
    console.log('ctx.origin: ', ctx.origin);
    console.log('ctx.href: ', ctx.href);
    console.log('ctx.path: ', ctx.path);
    console.log('ctx.query: ', ctx.query);
    console.log('ctx.querystring: ', ctx.querystring);
    console.log('ctx.host: ', ctx.host);
    console.log('ctx.hostname: ', ctx.hostname);
    console.log('ctx.fresh: ', ctx.fresh);
    console.log('ctx.stale: ', ctx.stale);
    console.log('ctx.protocol: ', ctx.protocol);
    console.log('ctx.secure: ', ctx.secure);
    console.log('ctx.ip: ', ctx.ip);
    console.log('ctx.ips: ', ctx.ips);
    console.log('ctx.subdomains: ', ctx.subdomains);
    console.log('ctx.body: ', ctx.body);
    console.log('ctx.status: ', ctx.status);
    console.log('ctx.message: ', ctx.message);
    console.log('ctx.headerSent: ', ctx.headerSent);
    console.log('ctx.request.body:', ctx.request.body);
    console.log('ctx.request.files:', ctx.request.files);

    console.log('-------------');

    ctx.body = {
        title: 'koa2 json',
    };
}

router.get('/test', test);
router.post('/test', test);

export default router;
