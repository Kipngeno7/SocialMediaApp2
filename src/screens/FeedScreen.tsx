// src/screens/FeedScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { connectSocket, subscribeToNewPosts } from '../services/socketService';
import { auth } from '../firebaseConfig';
import PostCard from '../components/PostCard';

import axios from 'axios';
import database from '@react-native-firebase/database';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [popup, setPopup] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [floatingDonations, setFloatingDonations] = useState<
    { id: string; amount: number; method: string; user: string; animatedValue: Animated.Value }[]
  >([]);
  const [topFans, setTopFans] = useState<{ user: string; total: number }[]>([]);

  const streamerId = 'STREAM01';
  const PLATFORM_CUT = 0.20;

  useEffect(() => {
    if (auth.currentUser) {
      connectSocket(auth.currentUser.uid);
      subscribeToNewPosts((newPost) => setPosts((prev) => [newPost, ...prev]));
    }

    // Wallet balance listener
    const walletRef = database().ref(`wallets/${streamerId}`);
    walletRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data && data.balance) setWalletBalance(data.balance);
    });

    // Top Fans leaderboard
    const donationsRef = database().ref(`liveDonations/${streamerId}`);
    donationsRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const totals: Record<string, number> = {};
        Object.values(data).forEach((donation: any) => {
          const donorName = donation.user || 'Anonymous';
          totals[donorName] = (totals[donorName] || 0) + donation.streamerAmount;
        });
        const sorted = Object.entries(totals)
          .map(([user, total]) => ({ user, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setTopFans(sorted);
      }
    });

    return () => {
      walletRef.off();
      donationsRef.off();
    };
  }, [auth.currentUser]);

  // Floating donation animation
  const addFloatingDonation = (amount: number, method: string, user: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newDonation = { id, amount, method, user, animatedValue: new Animated.Value(0) };
    setFloatingDonations(prev => [...prev, newDonation]);

    Animated.timing(newDonation.animatedValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      setFloatingDonations(prev => prev.filter(d => d.id !== id));
    });
  };

  // ===== Payment functions =====
  const handleDonation = async (method: 'Daraja' | 'Stripe', amount = 50) => {
    try {
      const streamerAmount = amount * (1 - PLATFORM_CUT);
      const donorName = auth.currentUser?.displayName || 'Anonymous';

      if (method === 'Daraja') {
        const res = await axios.post('http://YOUR_IP:3000/api/mpesa/stkpush', {
          phoneNumber: auth.currentUser?.phoneNumber || '2547XXXXXXXX',
          amount,
          accountReference: streamerId,
          transactionDesc: 'Tip for Streamer'
        });
        if (!res.data.success) throw new Error('M-Pesa failed');
      } else if (method === 'Stripe') {
        await axios.post('http://YOUR_IP:3000/api/stripe/charge', {
          amount,
          currency: 'usd',
          streamerId
        });
      }

      setPopup(`${method} Payment Successful! Streamer receives ${streamerAmount}`);
      setTimeout(() => setPopup(null), 10000);

      database().ref(`liveDonations/${streamerId}`).push({
        method,
        amount,
        streamerAmount,
        platformFee: amount * PLATFORM_CUT,
        user: donorName,
        timestamp: Date.now()
      });

      database().ref(`wallets/${streamerId}/balance`).transaction((balance) => (balance || 0) + streamerAmount);

      addFloatingDonation(streamerAmount, method, donorName);

    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // ===== Global Withdraw =====
  const withdrawToMobile = async (method: string, country?: string) => {
    try {
      if (walletBalance <= 0) {
        Alert.alert('No funds', 'Your wallet is empty');
        return;
      }

      const payload: any = { streamerId, amount: walletBalance };

      switch (method) {
        case 'M-Pesa': payload.phoneNumber = '2547XXXXXXXX'; break;
        case 'PayPal': payload.paypalEmail = 'STREAMER_PAYPAL_EMAIL'; break;
        case 'Stripe': payload.stripeAccountId = 'STREAMER_STRIPE_ACCOUNT'; break;
        case 'MTN': payload.phoneNumber = 'MTN_NUMBER'; payload.country = country || 'GH'; break;
        case 'Airtel': payload.phoneNumber = 'AIRTEL_NUMBER'; payload.country = country || 'TZ'; break;
        case 'GCash': payload.phoneNumber = 'GCASH_NUMBER'; payload.country = country || 'PH'; break;
        case 'Bank': payload.bankAccount = 'STREAMER_BANK'; payload.country = country || 'US'; break;
        default: throw new Error('Unsupported withdrawal method');
      }

      await axios.post(`http://YOUR_IP:3000/api/withdraw`, payload);

      setPopup(`Withdrawal of ${walletBalance} via ${method} successful`);
      setTimeout(() => setPopup(null), 10000);

      database().ref(`wallets/${streamerId}`).set({ balance: 0 });

    } catch (err: any) {
      Alert.alert('Withdrawal failed', err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>

      {/* Donation Section */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Support Streamer</Text>

      <TouchableOpacity onPress={() => handleDonation('Daraja')} style={{ backgroundColor: '#FFA500', padding: 12, marginBottom: 10, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay with M-Pesa</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleDonation('Stripe')} style={{ backgroundColor: '#6772E5', padding: 12, marginBottom: 20, borderRadius: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay with Stripe</Text>
      </TouchableOpacity>

      {/* Streamer Wallet */}
      <View style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Streamer Wallet</Text>
        <Text style={{ fontSize: 22, marginVertical: 10 }}>Balance: {walletBalance}</Text>

        {/* Dynamic Withdraw Buttons */}
        {['M-Pesa', 'PayPal', 'Stripe', 'MTN', 'Airtel', 'GCash', 'Bank'].map((method, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => withdrawToMobile(method)}
            style={{
              backgroundColor: method === 'M-Pesa' || method === 'MTN' || method === 'Airtel' || method === 'GCash' ? '#34A853' : '#FF6600',
              padding: 10,
              borderRadius: 8,
              marginTop: 10
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Withdraw via {method}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Posts Feed */}
      <FlatList data={posts} keyExtractor={(item) => item.id} renderItem={({ item }) => <PostCard post={item} />} />

      {/* Top Fans Leaderboard */}
      <View style={{ marginTop: 20, backgroundColor: '#fff', padding: 10, borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Top Fans</Text>
        {topFans.map((fan, index) => (
          <Text key={index}>{index + 1}️⃣ {fan.user} - ${fan.total}</Text>
        ))}
      </View>

      {/* Floating Donations */}
      {floatingDonations.map(donation => (
        <Animated.View
          key={donation.id}
          style={{
            position: 'absolute',
            bottom: 50,
            left: Math.random() * 200,
            opacity: donation.animatedValue,
            transform: [{ translateY: donation.animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, -150] }) }]
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {donation.user} sent {donation.method} ${donation.amount}
          </Text>
        </Animated.View>
      ))}

      {/* Popup */}
      {popup && (
        <View style={{ position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{popup}</Text>
        </View>
      )}

    </View>
  );
}
