import { useState } from 'react';
import { useCart } from '@/lib/useCart';
import { useMassages } from '@/lib/queries';
import PageHeader from '@/components/shared/PageHeader';
import SegmentedTabs, { TabItem } from '@/components/shared/SegmentedTabs';
import ProductCatalog from '@/components/ProductCatalog';
import MassageCard from '@/components/home/MassageCard';
import MassageDetailSheet from '@/components/home/MassageDetailSheet';
import ShortsViewer from '@/components/video/ShortsViewer';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function Shop() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('shop');
  const cart = useCart();

  const SHOP_TABS: TabItem[] = [
    { value: 'shop', label: t('shop.tabShop'), icon: ShoppingBag },
    { value: 'massages', label: t('shop.tabMassages'), icon: Sparkles },
  ];

  // Massages Data
  const { data: massages = [], isLoading: isLoadingMassages } = useMassages();
  const [selectedMassage, setSelectedMassage] = useState<any | null>(null);
  const [videoState, setVideoState] = useState<{ list: any[]; index: number } | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow={t('shop.eyebrow')}
          title={t('shop.title')}
          subtitle={t('shop.subtitle')}
        />
      </motion.div>

      {/* 2 Main Tabs: "Boutique" & "Massage" */}
      <motion.div variants={itemVariants} className="max-w-md mx-auto flex justify-center">
        <SegmentedTabs
          tabs={SHOP_TABS}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'shop' ? (
          <motion.div
            key="shop-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {/* Main Product Catalog in 2 Columns Grid */}
            <ProductCatalog />
          </motion.div>
        ) : (
          <motion.div
            key="massages-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="eyebrow block mb-0.5">{t('home.eyebrow')}</span>
                <h3 className="font-display text-xl sm:text-2xl text-cacao font-medium">
                  {t('shop.tabMassages')}
                </h3>
              </div>
            </div>

            {/* Grille de Massages VERTICALE EN 2 COLONNES */}
            {isLoadingMassages ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="aspect-4/3 rounded-3xl bg-white/40 animate-pulse" />
                <div className="aspect-4/3 rounded-3xl bg-white/40 animate-pulse" />
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
              >
                {massages.map((massage: any, idx: number) => (
                  <motion.div
                    key={massage.id ? `${massage.id}-${idx}` : `massage-${idx}`}
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="h-full"
                  >
                    <MassageCard
                      massage={massage}
                      onClick={() => setSelectedMassage(massage)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Massage Detail Sheet modal */}
      <MassageDetailSheet
        massage={selectedMassage}
        onClose={() => setSelectedMassage(null)}
        onSelectVideo={(v, related) => {
          const list = related && related.length > 0 ? related : (v ? [v] : []);
          const idx = Math.max(0, list.findIndex((item) => item.id === v?.id));
          if (list.length > 0) {
            setVideoState({ list, index: idx });
          }
        }}
      />

      {/* Fullscreen Video Player */}
      {videoState && (
        <ShortsViewer
          videos={videoState.list}
          initialIndex={videoState.index}
          onClose={() => setVideoState(null)}
        />
      )}
    </motion.div>
  );
}
