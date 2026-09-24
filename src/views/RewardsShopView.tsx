import React, { useState, useEffect } from 'react';
import { UserProfile, ShopItem, Achievement } from '../types';
import { db } from '../db/database';
import { sound } from '../utils/sound';
import { fireSubtleConfetti } from '../utils/confetti';
import {
  ShoppingBag,
  Award,
  Sparkles,
  Plus,
  Check,
  Coins,
  Lock,
  Palette,
  Smile,
  Coffee,
} from 'lucide-react';

interface RewardsShopViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const RewardsShopView: React.FC<RewardsShopViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'SHOP' | 'ACHIEVEMENTS'>('SHOP');
  const [shopCategory, setShopCategory] = useState<'THEME' | 'AVATAR' | 'REAL_LIFE'>('REAL_LIFE');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Add custom real life reward modal
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCost, setCustomCost] = useState<number>(300);
  const [customEmoji, setCustomEmoji] = useState<string>('🎮');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    const shopList = await db.shopItems.toArray();
    setItems(shopList);

    const achList = await db.achievements.toArray();
    setAchievements(achList);
  };

  const buyShopItem = async (item: ShopItem) => {
    sound.playClick();
    if (profile.coins < item.costCoins) {
      showToast(`Need ${item.costCoins - profile.coins} more coins! Complete quests to earn coins.`);
      return;
    }

    const updatedCoins = profile.coins - item.costCoins;
    const isUnlocked = profile.unlockedItems.includes(item.id);
    const newUnlocked = isUnlocked ? profile.unlockedItems : [...profile.unlockedItems, item.id];

    let newProfileUpdate: Partial<UserProfile> = {
      coins: updatedCoins,
      unlockedItems: newUnlocked,
    };

    if (item.category === 'THEME') {
      const themeKey = item.id.replace('shop-th-', '') as UserProfile['currentTheme'];
      newProfileUpdate.currentTheme = themeKey;
    } else if (item.category === 'AVATAR') {
      newProfileUpdate.avatarHat = item.icon;
    }

    // Update item redeemed count
    await db.shopItems.update(item.id, { redeemedCount: item.redeemedCount + 1 });
    await db.userProfile.update(1, newProfileUpdate);

    sound.playCoin();
    fireSubtleConfetti();
    onUpdateProfile(newProfileUpdate);
    loadShopData();
  };

  const handleCreateCustomReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    sound.playClick();
    const newItem: ShopItem = {
      id: `shop-rl-${Date.now()}`,
      title: customTitle.trim(),
      costCoins: customCost,
      category: 'REAL_LIFE',
      icon: customEmoji.trim() || '🎁',
      description: 'Custom self-defined real-life reward',
      redeemedCount: 0,
      custom: true,
    };

    await db.shopItems.add(newItem);
    setItems((prev) => [...prev, newItem]);
    setCustomTitle('');
    setShowAddCustom(false);
  };

  const claimAchievement = async (ach: Achievement) => {
    sound.playTaskComplete();
    sound.playCoin();
    fireSubtleConfetti();

    await db.achievements.update(ach.id, {
      unlocked: true,
      unlockedAt: new Date().toISOString().split('T')[0],
    });

    const updatedProfile = {
      xp: profile.xp + ach.xpReward,
      coins: profile.coins + ach.coinReward,
    };

    await db.userProfile.update(1, updatedProfile);
    onUpdateProfile(updatedProfile);
    loadShopData();
  };

  const filteredShopItems = items.filter((i) => i.category === shopCategory);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header & Coins Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-display text-white">
            Quest Treasury
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spend earned coins & collect mastery badges
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 font-mono font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
          <span className="text-base">🪙</span>
          <span>{profile.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Segmented Tab Bar (Shop vs Badges) */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('SHOP');
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'SHOP' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Loot & Rewards</span>
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('ACHIEVEMENTS');
          }}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'ACHIEVEMENTS' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges ({achievements.filter((a) => a.unlocked).length}/{achievements.length})</span>
        </button>
      </div>

      {/* VIEW A: SHOP */}
      {activeTab === 'SHOP' && (
        <section className="space-y-4">
          {/* Shop category selector */}
          <div className="flex items-center gap-2">
            {[
              { id: 'REAL_LIFE', label: 'Real-Life Rewards', icon: <Coffee className="w-3.5 h-3.5" /> },
              { id: 'AVATAR', label: 'Avatar Hats', icon: <Smile className="w-3.5 h-3.5" /> },
              { id: 'THEME', label: 'Themes', icon: <Palette className="w-3.5 h-3.5" /> },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setShopCategory(cat.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  shopCategory === cat.id
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Real-Life Rewards Header + Add Custom */}
          {shopCategory === 'REAL_LIFE' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Reward your discipline with guilt-free real-life breaks!
              </span>
              <button
                onClick={() => setShowAddCustom(!showAddCustom)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>
          )}

          {/* Add Custom Reward Form */}
          {showAddCustom && (
            <form
              onSubmit={handleCreateCustomReward}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 animate-in fade-in duration-150"
            >
              <h4 className="text-xs font-bold text-white">Define a Real-Life Reward</h4>
              <input
                type="text"
                placeholder="e.g. 1 hr gaming, Favorite pizza snack, Netflix episode..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Coin Price</label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    min={50}
                    step={50}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Create Reward
                </button>
              </div>
            </form>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredShopItems.map((item) => {
              const isUnlocked = profile.unlockedItems.includes(item.id);
              const canAfford = profile.coins >= item.costCoins;
              const isEquipped =
                (item.category === 'AVATAR' && profile.avatarHat === item.icon) ||
                (item.category === 'THEME' && profile.currentTheme === item.id.replace('shop-th-', ''));

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                      {item.redeemedCount > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Redeemed: {item.redeemedCount} time(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                      <span>🪙</span>
                      <span>{item.costCoins === 0 ? 'Free' : item.costCoins}</span>
                    </span>

                    <button
                      onClick={() => buyShopItem(item)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                        isEquipped
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : canAfford
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95'
                          : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isEquipped ? 'Equipped ✨' : isUnlocked ? 'Equip' : 'Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW B: ACHIEVEMENTS / BADGES */}
      {activeTab === 'ACHIEVEMENTS' && (
        <section className="space-y-3">
          <p className="text-xs text-slate-400">
            Conquer study milestones to unlock prestigious trophies, bonus XP, and coin bounties!
          </p>

          <div className="space-y-2.5">
            {achievements.map((ach) => {
              const isReadyToClaim = !ach.unlocked && (ach.progress || 0) >= (ach.maxProgress || 1);

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    ach.unlocked
                      ? 'bg-emerald-950/30 border-emerald-500/30'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                        ach.unlocked
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      {ach.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{ach.title}</h4>
                        {ach.unlocked && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{ach.description}</p>

                      {/* Progress bar if multi-step */}
                      {ach.maxProgress && ach.maxProgress > 1 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{
                                width: `${Math.min(100, ((ach.progress || 0) / ach.maxProgress) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {ach.progress || 0}/{ach.maxProgress}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono text-[10px]">
                      <span className="text-cyan-400 block font-bold">+{ach.xpReward} XP</span>
                      <span className="text-yellow-400">+{ach.coinReward} 🪙</span>
                    </div>

                    {isReadyToClaim ? (
                      <button
                        onClick={() => claimAchievement(ach)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition animate-bounce"
                      >
                        Claim!
                      </button>
                    ) : ach.unlocked ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
