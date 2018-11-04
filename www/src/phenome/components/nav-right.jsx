import Utils from '../utils/utils';
import Mixins from '../utils/mixins';

export default {
  name: 'f7-nav-right',
  props: {
    id: [String, Number],
    className: String, // phenome-react-line
    style: Object, // phenome-react-line
    sliding: Boolean,
    ...Mixins.colorProps,
  },
  render() {
    const props = this.props;
    const {
      className,
      id,
      style,
      sliding,
    } = props;

    const classes = Utils.classNames(
      className,
      'right',
      {
        sliding,
      },
      Mixins.colorClasses(props),
    );
    return (
      <div id={id} style={style} className={classes}>
        <slot />
      </div>
    );
  },
};
