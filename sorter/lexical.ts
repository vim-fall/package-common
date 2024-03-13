import type { Sorter } from "https://deno.land/x/fall_core@v0.5.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  reverse: is.Boolean,
})));

export function getSorter(
  options: Record<string, unknown>,
): Sorter {
  assert(options, isOptions);
  const alpha = options.reverse ? -1 : 1;
  return {
    sort: (_denops, items) => {
      items.sort((a, b) => {
        return a.value.localeCompare(b.value) * alpha;
      });
      return items;
    },
  };
}
