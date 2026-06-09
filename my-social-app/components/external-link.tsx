import { type ComponentProps } from 'react';
import { Linking, Pressable } from 'react-native';

type Props = Omit<ComponentProps<typeof Pressable>, 'onPress'> & {
  href: string;
  onPress?: ComponentProps<typeof Pressable>['onPress'];
};

export function ExternalLink({ href, onPress, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async (event: any) => {
        if (onPress) {
          onPress(event);
        }

        await Linking.openURL(href);
      }}
    />
  );
}
