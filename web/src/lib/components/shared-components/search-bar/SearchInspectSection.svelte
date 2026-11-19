<script lang="ts">
  import { searchManager } from '#lib/managers/search-manager.svelte.ts';
  import { AssetOrder } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import SearchButton from './SearchButton.svelte';

  const LIMIT_MIN = 50;
  const LIMIT_MAX = 500;
  const LIMIT_STEP = 50;

  let inspect = $derived(searchManager.filter.inspect);
  let isSmart = $derived(searchManager.filter.queryType === 'smart');
</script>

{#if isSmart}
  <div id="smart-inspect-options">
    <fieldset>
      <Text class="py-5" fontWeight="medium">{$t('search_filter_inspect_title')}</Text>
      <Text class="pb-3 text-sm text-gray-500 dark:text-gray-400">{$t('search_filter_inspect_description')}</Text>

      <div class="flex flex-wrap gap-2 pb-4">
        <SearchButton
          checked
          active={inspect.enabled}
          onclick={() => {
            inspect.enabled = !inspect.enabled;
            if (inspect.enabled && !inspect.order) {
              inspect.order = AssetOrder.Desc;
            }
          }}>{$t('search_filter_inspect_enable')}</SearchButton
        >
      </div>

      {#if inspect.enabled}
        <label class="flex flex-col gap-2 pb-4" for="inspect-limit">
          <span class="text-sm font-medium">
            {$t('search_filter_inspect_limit', { values: { count: inspect.limit } })}
          </span>
          <input
            id="inspect-limit"
            type="range"
            min={LIMIT_MIN}
            max={LIMIT_MAX}
            step={LIMIT_STEP}
            value={inspect.limit}
            oninput={(event) => {
              inspect.limit = Number((event.currentTarget as HTMLInputElement).value);
            }}
            class="w-full accent-immich-primary dark:accent-immich-dark-primary"
          />
        </label>

        <Text class="pb-2 text-sm font-medium">{$t('search_filter_inspect_order')}</Text>
        <div class="flex flex-wrap gap-2">
          <SearchButton
            checked
            active={inspect.order === AssetOrder.Desc}
            onclick={() => (inspect.order = AssetOrder.Desc)}>{$t('newest_first')}</SearchButton
          >
          <SearchButton
            checked
            active={inspect.order === AssetOrder.Asc}
            onclick={() => (inspect.order = AssetOrder.Asc)}>{$t('oldest_first')}</SearchButton
          >
          <SearchButton checked active={inspect.order === undefined} onclick={() => (inspect.order = undefined)}
            >{$t('search_filter_inspect_relevance')}</SearchButton
          >
        </div>
      {/if}
    </fieldset>
  </div>
{/if}
