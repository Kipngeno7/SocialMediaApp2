import { ComponentType } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type SymbolWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

type SymbolViewProps = {
  name: string;
};

const expoSymbols = require('expo-symbols') as {
  SymbolView: ComponentType<{
    weight?: SymbolWeight;
    tintColor?: string;
    resizeMode?:
      | 'cover'
      | 'contain'
      | 'stretch'
      | 'repeat'
      | 'center'
      | 'scaleAspectFit'
      | 'scaleAspectFill';
    name: string;
    style?: StyleProp<ViewStyle>;
  }>;
};

const SymbolView = expoSymbols.SymbolView;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
