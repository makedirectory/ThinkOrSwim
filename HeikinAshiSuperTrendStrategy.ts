declare upper;
input ST_Coeff = 1; # Between 1 - 100
input ST_Period = 15; # Between 1 - 100
input tradeFunds = 10000; # Amount to trade
input aggrPd = AggregationPeriod.FOUR_HOURS;

###############
# SuperTrend #
###############

# Heikin Ashi
def hacl = ( open(period = aggrPd) + high(period = aggrPd) + low(period = aggrPd) + close(period = aggrPd) ) / 4;
def haop = CompoundValue(1, (haop[1] + hacl[1]) / 2, (open(period = aggrPd)[1] + close(period = aggrPd)[1]) / 2);
def hahi = Max( open(period = aggrPd), Max( hacl, haop ) );
def halo = Min( low(period = aggrPd), Min( hacl, haop ) );

def hahl2 = (hahi + halo) / 2;

def iATR = MovingAverage(AverageType.WILDERS, TrueRange(hahi, hacl, halo), ST_Period);

def tmpUp = hahl2 - (ST_Coeff * iATR);
def tmpDn = hahl2 + (ST_Coeff * iATR);
def finalUp = If(close(period = aggrPd)[1] > finalUp[1], Max(tmpUp, finalUp[1]), tmpUp);
def finalDn = If(close(period = aggrPd)[1] < finalDn[1], Min(tmpDn, finalDn[1]), tmpDn);
def trendDir = If( close(period = aggrPd) > finalDn[1], 1, If( close(period = aggrPd) < finalUp[1], -1, If(!IsNaN(trendDir[1]), trendDir[1], 1) ) );
def trendLine = If(trendDir == 1, finalUp, finalDn);
plot SuperTrend = trendLine;

SuperTrend.DefineColor( "up", Color.GREEN );
SuperTrend.DefineColor( "dn", Color.RED );
SuperTrend.AssignValueColor(SuperTrend.Color("up"));
SuperTrend.AssignValueColor( if close(period = aggrPd)[1] > SuperTrend[1] then SuperTrend.Color( "up" ) else SuperTrend.Color( "dn" ) );
SuperTrend.SetLineWeight( 2 );

###############
# Strategy Calculations #
###############

def entryPrice = open(period = aggrPd)[-1];
def exitPrice = open(period = aggrPd)[-1];
def tSize = Round(Average(tradeFunds / entryPrice));

def bullmk = ( close(period = aggrPd)[-1] > SuperTrend[-1] and close(period = aggrPd)[0] < SuperTrend[0] );
def bearmk = ( close(period = aggrPd)[-1] < SuperTrend[-1] and close(period = aggrPd)[0] > SuperTrend[0] );

# Bull Market BUY
AddOrder(OrderType.BUY_TO_OPEN, bullmk, price = entryPrice, tradeSize = tSize, tickcolor = GetColor(0), arrowcolor = GetColor(1));
# Buy Alert
Alert(bullmk, Sound.Chimes, Alert.BAR);

# Bull Market SELL
AddOrder(OrderType.SELL_TO_CLOSE, bearmk, price = exitPrice, tradeSize = tSize, tickcolor = GetColor(1), arrowcolor = GetColor(0));
#Sell Alert
Alert(bearmk, Sound.Chimes, Alert.BAR);
