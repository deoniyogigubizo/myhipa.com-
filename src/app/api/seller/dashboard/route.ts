import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { User, Seller, Product, Order, Transaction, Review, AuditLog } from '@/lib/database/schemas';
import { withSellerAuth } from '@/lib/auth/middleware';


export const dynamic = "force-dynamic";
export const GET = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch orders
    const orders = await Order.find({ sellerId: seller._id })
      .populate('buyerId', 'profile.displayName profile.avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch products
    const products = await Product.find({ sellerId: seller._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch transactions
    const transactions = await Transaction.find({ sellerId: seller._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch reviews
    const reviews = await Review.find({ sellerId: seller._id })
      .populate('buyerId', 'profile.displayName profile.avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Calculate KPIs
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const todayRevenue = orders
      .filter(o => o.status === 'completed' && o.createdAt >= todayStart)
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const weekRevenue = orders
      .filter(o => o.status === 'completed' && o.createdAt >= weekStart)
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const monthRevenue = orders
      .filter(o => o.status === 'completed' && o.createdAt >= monthStart)
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const lastMonthRevenue = orders
      .filter(o => o.status === 'completed' && o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd)
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const revenueChange = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Order counts
    const pendingOrders = orders.filter(o => o.status === 'pending_payment').length;
    const processingOrders = orders.filter(o => o.status === 'seller_processing').length;
    const shippedOrders = orders.filter(o => o.status === 'in_delivery').length;
    const deliveredOrders = orders.filter(o => o.status === 'dispute_window').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const disputedOrders = orders.filter(o => o.status === 'disputed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Escrow balance
    const escrowBalance = orders
      .filter(o => ['processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    const releasingToday = orders
      .filter(o => o.status === 'dispute_window' && o.updatedAt && 
        new Date(o.updatedAt).getTime() < now.getTime() - 3 * 24 * 60 * 60 * 1000)
      .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);

    // Wallet balance
    const walletBalance = seller.wallet.available;
    const pendingBalance = seller.wallet.pending;
    const heldBalance = seller.wallet.held;

    // Rating
    const avgRating = seller.stats.avgRating;
    const reviewCount = seller.stats.reviewCount;

    // Low stock products
    const lowStockProducts = products.filter(p => p.inventory?.totalStock <= (p.inventory?.lowStockThreshold || 3) && p.inventory?.totalStock > 0);
    const outOfStockProducts = products.filter(p => p.inventory?.totalStock === 0);

    // Recent activity - fetch from AuditLog
    const recentActivity = [];
    
    // Fetch recent activities from AuditLog
    const auditLogs = await AuditLog.find({ 'actor.userId': user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Map audit logs to activity format
    auditLogs.forEach(log => {
      let icon = '📝';
      let description = log.action;
      let link = '/seller/dashboard';
      
      // Map action types to icons and descriptions
      switch (log.action) {
        case 'user_login':
          icon = '🔐';
          description = 'Logged in to account';
          break;
        case 'user_logout':
          icon = '🚪';
          description = 'Logged out of account';
          break;
        case 'product_created':
          icon = '📦';
          description = `Created product: ${log.metadata?.title || 'New Product'}`;
          link = `/seller/products/${log.entity?.id}/edit`;
          break;
        case 'product_updated':
          icon = '✏️';
          description = `Updated product: ${log.metadata?.title || 'Product'}`;
          link = `/seller/products/${log.entity?.id}/edit`;
          break;
        case 'order_received':
          icon = '🛒';
          description = `New order received: #${log.metadata?.orderNumber || ''}`;
          link = `/seller/orders/${log.entity?.id}`;
          break;
        case 'order_shipped':
          icon = '🚚';
          description = `Order shipped: #${log.metadata?.orderNumber || ''}`;
          link = `/seller/orders/${log.entity?.id}`;
          break;
        case 'order_delivered':
          icon = '✅';
          description = `Order delivered: #${log.metadata?.orderNumber || ''}`;
          link = `/seller/orders/${log.entity?.id}`;
          break;
        case 'review_received':
          icon = '⭐';
          description = `Received ${log.metadata?.rating || 5}-star review`;
          link = '/seller/reviews';
          break;
        case 'message_sent':
          icon = '💬';
          description = 'Sent a message';
          link = '/seller/messages';
          break;
        case 'message_received':
          icon = '📩';
          description = 'Received a message';
          link = '/seller/messages';
          break;
        case 'cart_added':
          icon = '🛒';
          description = `Added item to cart: ${log.metadata?.productName || 'Product'}`;
          break;
        case 'cart_removed':
          icon = '🗑️';
          description = `Removed item from cart: ${log.metadata?.productName || 'Product'}`;
          break;
        case 'search_performed':
          icon = '🔍';
          description = `Searched for: ${log.metadata?.query || 'products'}`;
          break;
        case 'product_viewed':
          icon = '👁️';
          description = `Viewed product: ${log.metadata?.title || 'Product'}`;
          break;
        case 'profile_updated':
          icon = '👤';
          description = 'Updated profile information';
          link = '/seller/settings';
          break;
        case 'settings_updated':
          icon = '⚙️';
          description = 'Updated settings';
          link = '/seller/settings';
          break;
        case 'payment_received':
          icon = '💰';
          description = `Payment received: ${log.metadata?.amount?.toLocaleString() || 0} RWF`;
          link = '/seller/finance';
          break;
        case 'payout_requested':
          icon = '💸';
          description = `Payout requested: ${log.metadata?.amount?.toLocaleString() || 0} RWF`;
          link = '/seller/finance';
          break;
        default:
          icon = '📝';
          description = log.action.replace(/_/g, ' ');
      }
      
      recentActivity.push({
        type: log.action,
        icon,
        description,
        amount: log.metadata?.amount,
        timestamp: log.createdAt,
        link
      });
    });
    
    // If no audit logs, fall back to orders, reviews, transactions
    if (recentActivity.length === 0) {
      // Add recent orders
      orders.slice(0, 5).forEach(order => {
        recentActivity.push({
          type: 'order',
          icon: '📦',
          description: `New order #${order._id.toString().slice(-6)} from ${(order.buyerId as any)?.profile?.displayName || 'Customer'}`,
          amount: order.pricing?.total || 0,
          timestamp: order.createdAt,
          link: `/seller/orders/${order._id}`
        });
      });

      // Add recent reviews
      reviews.slice(0, 3).forEach(review => {
        recentActivity.push({
          type: 'review',
          icon: '⭐',
          description: `Review posted ${'★'.repeat(review.rating)} by ${(review.buyerId as any)?.profile?.displayName || 'Customer'}`,
          timestamp: review.createdAt,
          link: `/seller/reviews`
        });
      });

      // Add recent transactions
      transactions.slice(0, 3).forEach(tx => {
        if (tx.escrow?.status === 'released') {
          recentActivity.push({
            type: 'escrow',
            icon: '💰',
            description: `Escrow released — ${tx.amount.toLocaleString()} RWF added to wallet`,
            amount: tx.amount,
            timestamp: tx.createdAt,
            link: `/seller/finance`
          });
        }
      });
    }

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Revenue chart data (last 7 days)
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayRevenue = orders
        .filter(o => o.status === 'completed' && o.createdAt >= dayStart && o.createdAt < dayEnd)
        .reduce((sum, o) => sum + (o.pricing?.sellerPayout || 0), 0);
      
      revenueChart.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue
      });
    }

    // Top products
    const productSales = new Map();
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const existing = productSales.get(item.productId) || { sales: 0, revenue: 0 };
        existing.sales += item.quantity;
        existing.revenue += item.price * item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, stats]) => {
        const product = products.find(p => p._id.toString() === productId.toString());
        return {
          id: productId,
          name: product?.title || 'Unknown Product',
          sales: stats.sales,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Alerts
    const alerts = [];
    
    if (pendingOrders > 0) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        message: `${pendingOrders} orders pending review`,
        link: '/seller/orders?status=pending'
      });
    }

    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        icon: '📦',
        message: `${lowStockProducts.length} products low stock`,
        link: '/seller/products?filter=low-stock'
      });
    }

    if (outOfStockProducts.length > 0) {
      alerts.push({
        type: 'error',
        icon: '🚫',
        message: `${outOfStockProducts.length} products out of stock`,
        link: '/seller/products?filter=out-of-stock'
      });
    }

    if (disputedOrders > 0) {
      alerts.push({
        type: 'error',
        icon: '⚠️',
        message: `${disputedOrders} orders in dispute`,
        link: '/seller/orders?status=disputed'
      });
    }

    if (releasingToday > 0) {
      alerts.push({
        type: 'success',
        icon: '💰',
        message: `Payout available: ${releasingToday.toLocaleString()} RWF`,
        link: '/seller/finance'
      });
    }

    // Unread messages count (placeholder - would need messages collection)
    const unreadMessages = 0;

    return NextResponse.json({
      seller: {
        id: seller._id,
        storeName: seller.store.name,
        storeSlug: seller.store.slug,
        tier: seller.tier,
        kycStatus: seller.kycStatus,
        onboardingStep: seller.onboardingStep
      },
      kpis: {
        revenue: {
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          total: totalRevenue,
          change: revenueChange
        },
        orders: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          completed: completedOrders,
          disputed: disputedOrders,
          cancelled: cancelledOrders,
          total: orders.length
        },
        escrow: {
          balance: escrowBalance,
          releasingToday
        },
        wallet: {
          available: walletBalance,
          pending: pendingBalance,
          held: heldBalance
        },
        rating: {
          average: avgRating,
          count: reviewCount
        },
        messages: {
          unread: unreadMessages
        }
      },
      alerts,
      recentActivity: recentActivity.slice(0, 10),
      revenueChart,
      topProducts,
      recentOrders: orders.slice(0, 10).map(order => ({
        id: order._id,
        orderNumber: order._id.toString().slice(-6),
        buyer: (order.buyerId as any)?.profile?.displayName || 'Customer',
        buyerAvatar: (order.buyerId as any)?.profile?.avatar,
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.pricing?.total || 0,
        status: order.status,
        createdAt: order.createdAt,
        shippedAt: order.delivery?.tracking?.uploadedAt,
        deliveredAt: order.delivery?.tracking?.proofUrl ? order.delivery?.tracking?.uploadedAt : undefined
      })),
      lowStockProducts: lowStockProducts.map(p => ({
        id: p._id,
        name: p.title,
        stock: p.inventory?.totalStock || 0,
        lowStockThreshold: p.inventory?.lowStockThreshold || 3
      })),
      outOfStockProducts: outOfStockProducts.map(p => ({
        id: p._id,
        name: p.title
      }))
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
