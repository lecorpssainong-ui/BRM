import { useAppSettings } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import StoriesStrip from '@/components/home/StoriesStrip';
import HeroSection from '@/components/home/HeroSection';
import QuickBridges from '@/components/home/QuickBridges';
import MassageCollection from '@/components/home/MassageCollection';
import VideoStrip from '@/components/home/VideoStrip';
import CenterCard from '@/components/home/CenterCard';
import MomoPlanner from '@/components/home/MomoPlanner';
import { motion, type Variants } from 'framer-motion';

export const DEFAULT_ORDER = ['hero', 'bridges', 'massages', 'videos', 'center', 'momo'];

export default function Home() {
  const { data: settings } = useAppSettings();
  const profile = useProfile();

  const order =
    Array.isArray(settings?.hero_sections_order) && settings.hero_sections_order.length > 0
      ? settings.hero_sections_order
      : Array.isArray(settings?.home_sections) && settings.home_sections.length > 0
      ? settings.home_sections
      : DEFAULT_ORDER;

  const blocks: Record<string, React.ReactNode> = {
    hero: <HeroSection name={profile?.name} />,
    bridges: <QuickBridges />,
    massages: <MassageCollection />,
    videos: <VideoStrip />,
    center: <CenterCard />,
    momo: <MomoPlanner />,
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 22, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 sm:space-y-16"
    >
      {/* Top Statuts / Stories Ring Carousel */}
      <motion.div variants={itemVariants}>
        <StoriesStrip />
      </motion.div>

      {/* Main Ordered Sections with Cascading Entrance */}
      {order.map((key) =>
        blocks[key] ? (
          <motion.div key={key} variants={itemVariants}>
            {blocks[key]}
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}
