import json, math

def make_body(mask_fn, hl_fn=None, sh_fn=None):
    """mask_fn(x,y)->bool, returns 32x32 pixel array with outline/highlight/shadow"""
    W, H = 32, 32
    raw = [[0]*W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if mask_fn(x, y):
                raw[y][x] = 1

    # Outline pass
    result = [row[:] for row in raw]
    for y in range(H):
        for x in range(W):
            if raw[y][x] == 0:
                for dy in [-1,0,1]:
                    for dx in [-1,0,1]:
                        ny,nx = y+dy,x+dx
                        if 0<=ny<H and 0<=nx<W and raw[ny][nx]==1:
                            result[y][x] = 2
                            break

    # Highlight / Shadow pass (only inside body pixels)
    for y in range(H):
        for x in range(W):
            if raw[y][x] == 1:
                if hl_fn and hl_fn(x, y):
                    result[y][x] = 3
                elif sh_fn and sh_fn(x, y):
                    result[y][x] = 4

    return result

cx, cy = 16, 17  # center

# ── Type 4: Fire (flame silhouette) ───────────────────────────
def fire_mask(x, y):
    dx,dy = x-cx, y-cy
    # Lower body: ellipse
    if dy >= -2:
        return (dx/9)**2 + ((dy)/8)**2 < 1
    # Upper: flame tongues
    dy2 = dy+2
    # center tongue
    if abs(dx) <= 4 and dy >= -10:
        return (dx/4)**2 + (dy2/10)**2 < 1
    # left tongue
    if dx<0 and dx>=-7 and dy>=-8:
        return ((dx+3)/3.5)**2 + (dy2/7)**2 < 1
    # right tongue
    if dx>0 and dx<=7 and dy>=-8:
        return ((dx-3)/3.5)**2 + (dy2/7)**2 < 1
    return False

# ── Type 5: Water (round with 3 leg tentacles) ────────────────
def water_mask(x, y):
    dx,dy = x-cx, y-cy
    # Main body
    if (dx/9)**2 + ((dy-1)/9)**2 < 1:
        return True
    # Three tentacles
    legs = [(-5,10,3,5),(0,11,3,5),(5,10,3,5)]
    for lx,ly,hw,hh in legs:
        if abs(x-(cx+lx))<=hw and abs(y-(cy+ly))<=hh:
            return True
    return False

# ── Type 6: Grass (round + leaf stem on top) ──────────────────
def grass_mask(x, y):
    dx,dy = x-cx, y-cy
    if (dx/9)**2 + (dy/9)**2 < 1:
        return True
    # Stem
    if abs(dx)<=1 and -13<=dy<=-9:
        return True
    # Leaf
    if -12<=dy<=-8:
        ldx = dx - (dy+12)*0.7
        if abs(ldx)<=4:
            return True
    return False

# ── Type 7: Lightning (zigzag bolt silhouette) ────────────────
def lightning_mask(x, y):
    # Main bolt path
    cx2 = cx
    # top to mid: leans right, bot: leans left
    if 2<=y<=13:
        mid = cx2 + (y-2)*0.5
        if abs(x-mid) <= 5-abs(y-7)*0.1:
            return True
    if 13<=y<=25:
        mid = cx2 + 3.5 - (y-13)*0.7
        if abs(x-mid) <= 5-abs(y-19)*0.1:
            return True
    # body circle at center
    dx,dy = x-cx,y-cy
    if (dx/5)**2+(dy/5)**2<1:
        return True
    return False

# ── Type 8: Rock (chunky square-ish with chips) ───────────────
def rock_mask(x, y):
    dx,dy = x-cx, y-(cy-1)
    # square body, rounded corners
    if abs(dx)<=9 and abs(dy)<=9:
        if abs(dx)+abs(dy) < 17:  # chamfered corners
            return True
    return False

# ── Type 9: Ice crystal (diamond / hexagon) ───────────────────
def ice_mask(x, y):
    dx,dy = x-cx, y-cy
    # Hexagonal silhouette
    a,b = 9, 12
    if abs(dy)/b + abs(dx)/a < 1:
        return True
    # Small top spike
    if abs(dx)<=2 and -15<=dy<=-12:
        return True
    # Side facet bumps
    if abs(dx) >= 7 and abs(dy) <= 4:
        if (abs(dx)-7)/3 + abs(dy)/4 < 1:
            return True
    return False

# ── Type 10: Dark / Ghost (ghost tail) ───────────────────────
def dark_mask(x, y):
    dx,dy = x-cx, y-(cy-2)
    # Round head
    if (dx/9)**2 + (dy/9)**2 < 1:
        return True
    # Tail: wavy bottom
    if dy > 0:
        wave = int(math.sin(dy*1.0)*2.5)
        if abs((x-cx)-wave) <= 6 - dy*0.35:
            return True
    return False

# ── Type 11: Light / Fairy (round with 4 wing bumps) ─────────
def light_mask(x, y):
    dx,dy = x-cx, y-(cy-1)
    # Core body
    if (dx/7)**2+(dy/7)**2 < 1:
        return True
    # 4 wing lobes
    wings = [(-9,-1,5,4),(9,-1,5,4),(-5,-7,4,4),(5,-7,4,4)]
    for wx,wy,wa,wb in wings:
        if ((dx-wx)/wa)**2+((dy-wy)/wb)**2 < 1:
            return True
    return False

# ── Type 12: Wind (tear-drop leaning + swirl wisps) ──────────
def wind_mask(x, y):
    dx,dy = x-(cx+1), y-(cy-1)
    # Lean left: main body
    if (dx/8)**2 + (dy/10)**2 < 1:
        return True
    # Top pointed tip
    if abs(dx)<=2 and -14<=dy<=-11:
        return True
    # Trailing wisps (right side)
    for wy,wx0,wr in [(3,7,5),(6,9,4),(9,8,3),(12,6,3)]:
        if (dx-(wx0-8))**2+(dy-wy)**2 < wr**2:
            return True
    return False

# ── Common highlight/shadow ───────────────────────────────────
def hl(x,y): return x < cx-2 and y < cy-2
def sh(x,y): return x > cx+2 or y > cy+4

bodies = [
    make_body(fire_mask,    hl, sh),
    make_body(water_mask,   hl, sh),
    make_body(grass_mask,   hl, sh),
    make_body(lightning_mask, hl, sh),
    make_body(rock_mask,    hl, sh),
    make_body(ice_mask,     hl, sh),
    make_body(dark_mask,    hl, sh),
    make_body(light_mask,   hl, sh),
    make_body(wind_mask,    hl, sh),
]

with open("pixel_arrays.json","w") as f:
    json.dump(bodies, f)
print("Done! Generated", len(bodies), "bodies")
