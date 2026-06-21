import { getTranslations } from 'next-intl/server';

export default async function Statement() {
  const t = await getTranslations('statement');

  return (
    <section className="bg-[#0B0B0E] py-24 text-center md:py-32">
      <p className="mx-auto max-w-3xl px-5 text-2xl font-semibold leading-relaxed text-white md:text-4xl">
        {t('line1')} <span className="italic text-[#F59E0B]">{t('emphasis1')}</span>
        <br />
        {t('line2pre')} <span className="text-[#A78BFA]">{t('word1')}</span> {t('line2mid')}{' '}
        <span className="text-[#A78BFA]">{t('word2')}</span> {t('line2post')}
      </p>
    </section>
  );
}
