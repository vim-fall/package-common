/**
 * Quickfix action sends the selected items, the processed items, or the cursor item to the quickfix list.
 *
 * The following options are available:
 *
 * - `what` (optional): An object that contains the context of the action. It can contain the following properties:
 *   - `context`: The context of the action.
 *   - `id`: The ID of the action.
 *   - `idx`: The index of the action.
 *   - `nr`: The number of the action.
 *   - `title`: The title of the action.
 *  - `action` (optional): The action to perform. It can be one of the following:
 *    - `a`: Append the items to the quickfix list.
 *    - `r`: Replace the items in the quickfix list.
 *    - `f`: Open the quickfix list and replace the items.
 *    - ` `: Open the quickfix list and append the items.
 *  - `target` (optional): The target of the action. It can be one of the following:
 *    - `selected-or-cursor`: Use the selected items if available, otherwise use the cursor item.
 *    - `selected-or-processed`: Use the selected items if available, otherwise use the processed items.
 *
 * @module
 */
import type { Action } from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.3.0/function/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  what: is.PartialOf(is.ObjectOf({
    context: is.Unknown,
    id: is.Number,
    idx: is.UnionOf([is.Number, is.String]),
    nr: is.Number,
    title: is.String,
  })),
  action: is.LiteralOneOf(["a", "r", "f", " "] as const),
  target: is.LiteralOneOf(
    [
      "selected-or-cursor",
      "selected-or-processed",
    ] as const,
  ),
})));

const isPathDetail = is.ObjectOf({
  path: is.String,
  line: is.OptionalOf(is.Number),
  column: is.OptionalOf(is.Number),
});

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function getAction(
  options: Record<string, unknown>,
): Action {
  assert(options, isOptions);
  const what = options.what ?? {};
  const action = options.action ?? " ";
  const target = options.target ?? "selected-or-cursor";
  return {
    invoke: async (denops, { cursorItem, selectedItems, processedItems }) => {
      const source = selectedItems.length > 0
        ? selectedItems
        : target === "selected-or-cursor"
        ? cursorItem ? [cursorItem] : []
        : processedItems;
      const items = source
        .map((item) => {
          if (isPathDetail(item.detail)) {
            return {
              filename: item.detail.path,
              lnum: item.detail.line,
              col: item.detail.column,
            };
          }
          return undefined;
        })
        .filter(isDefined);
      try {
        await fn.setqflist(denops, [], action, {
          ...what,
          items,
        });
      } catch (err) {
        // Fail silently
        console.debug(
          `[fall] (action/quickfix) Failed to set quickfix list:`,
          err,
        );
      }
      return false;
    },
  };
}
