import Bio from './Bio';

const React = BdApi.React;

const markupClass = BdApi.Webpack.getByKeys('markup')?.markup;
const textClass = BdApi.Webpack.getByKeys('text-sm/normal')['text-sm/normal'];
const scrollerBaseClasses = BdApi.Webpack.getByKeys('scrollerBase', 'disableScrollAnchor');
const classes = {
  markup: markupClass ?? 'markup__75297',
  text: textClass ?? 'text-sm/normal_cf4812',
  thin: scrollerBaseClasses?.thin ?? 'thin_d125d2',
};

export default function PopoutBio({ content }) {
  return (
    <div className={classes.thin} style={{ overflow: 'hidden scroll', 'max-height': '30vh' }}>
      <div className={classes.markup}>
        <div className={classes.text}>
          <Bio content={content} />
        </div>
      </div>
    </div>
  );
}
